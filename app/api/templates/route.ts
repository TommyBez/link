import { and, desc, eq, gt, inArray } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { hashPayloadSHA256 } from '@/lib/crypto'
import { db } from '@/lib/db'
import { templates, templateVersions } from '@/lib/db/schema'
import { requireStaff } from '@/lib/server/guard'
import { type TemplateDraftInput, templateDraft } from '@/lib/templates/schema'

type TemplateStatus = 'draft' | 'published' | 'archived'

type PostBody = {
  templateId?: string
  template: TemplateDraftInput
}

function isTemplateStatus(value: string | null): value is TemplateStatus {
  return value === 'draft' || value === 'published' || value === 'archived'
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireStaff()
    const body = (await request.json()) as PostBody | undefined

    if (!body?.template) {
      return NextResponse.json(
        { error: 'Payload template mancante.' },
        { status: 400 },
      )
    }

    const parsed = templateDraft.safeParse(body.template)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Payload template non valido.',
          details: parsed.error.issues,
        },
        { status: 422 },
      )
    }

    const payload = parsed.data
    const checksum = hashPayloadSHA256(payload)
    const now = new Date()

    let templateId = body.templateId

    if (templateId) {
      const id = templateId
      const existing = await db.query.templates.findFirst({
        where: (t, { and: andWhere, eq: eqWhere }) =>
          andWhere(eqWhere(t.id, id), eqWhere(t.orgId, context.orgId)),
      })

      if (!existing) {
        return NextResponse.json(
          { error: 'Template non trovato.' },
          { status: 404 },
        )
      }

      await db
        .update(templates)
        .set({
          name: payload.name,
          status: 'draft',
          updatedAt: now,
        })
        .where(eq(templates.id, templateId))
    } else {
      const [created] = await db
        .insert(templates)
        .values({
          orgId: context.orgId,
          name: payload.name,
          status: 'draft',
          updatedAt: now,
        })
        .returning({ id: templates.id })

      templateId = created.id
    }

    await db
      .insert(templateVersions)
      .values({
        templateId,
        version: 0,
        schemaJson: payload,
        checksum,
        publishedAt: now,
      })
      .onConflictDoUpdate({
        target: [templateVersions.templateId, templateVersions.version],
        set: {
          schemaJson: payload,
          checksum,
          publishedAt: now,
        },
      })

    // Fetch the latest published version (if any) to return in response
    const latestPublished = await db
      .select({ version: templateVersions.version })
      .from(templateVersions)
      .where(
        and(
          eq(templateVersions.templateId, templateId),
          gt(templateVersions.version, 0),
        ),
      )
      .orderBy(desc(templateVersions.version))
      .limit(1)
      .then((rows) => rows[0] ?? null)

    return NextResponse.json(
      {
        id: templateId,
        status: 'draft' as TemplateStatus,
        ...(latestPublished && { version: latestPublished.version }),
      },
      { status: body.templateId ? 200 : 201 },
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Impossibile salvare la bozza del template.' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireStaff()
    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status')
    const includeParam = searchParams.get('include')

    const includeVersions = includeParam === 'versions'
    const statusFilter = isTemplateStatus(statusParam) ? statusParam : null

    const templateRows = await db.query.templates.findMany({
      where: (t, { and: andWhere, eq: eqWhere }) =>
        statusFilter && statusFilter !== 'archived'
          ? andWhere(
              eqWhere(t.orgId, context.orgId),
              eqWhere(t.status, statusFilter),
            )
          : eqWhere(t.orgId, context.orgId),
      orderBy: (t, { desc: descOrder }) => descOrder(t.updatedAt),
    })

    const templateIds = templateRows.map((row) => row.id)

    const versionRows = templateIds.length
      ? await db
          .select()
          .from(templateVersions)
          .where(inArray(templateVersions.templateId, templateIds))
          .orderBy(desc(templateVersions.version))
      : []

    const groupedVersions = new Map<
      string,
      Array<{
        id: string
        templateId: string
        version: number
        schemaJson: unknown
        checksum: string
        publishedAt: Date
      }>
    >()

    for (const version of versionRows) {
      const list = groupedVersions.get(version.templateId) ?? []
      list.push(version)
      groupedVersions.set(version.templateId, list)
    }

    const results = templateRows
      .map((template) => {
        const versions = groupedVersions.get(template.id) ?? []
        const draftVersion =
          versions.find((version) => version.version === 0) ?? null
        const publishedVersions = versions.filter(
          (version) => version.version > 0,
        )
        const latestPublished = publishedVersions.at(0) ?? null

        if (statusFilter === 'published' && publishedVersions.length === 0) {
          return null
        }

        return {
          id: template.id,
          name: template.name,
          status: template.status as TemplateStatus,
          createdAt: template.createdAt?.toISOString() ?? null,
          updatedAt: template.updatedAt?.toISOString() ?? null,
          draft: draftVersion
            ? {
                id: draftVersion.id,
                checksum: draftVersion.checksum,
                updatedAt: draftVersion.publishedAt.toISOString(),
                schema: draftVersion.schemaJson as TemplateDraftInput,
              }
            : null,
          latestPublished: latestPublished
            ? {
                id: latestPublished.id,
                version: latestPublished.version,
                checksum: latestPublished.checksum,
                publishedAt: latestPublished.publishedAt.toISOString(),
                schema: latestPublished.schemaJson as TemplateDraftInput,
              }
            : null,
          versions: includeVersions
            ? publishedVersions.map((version) => ({
                id: version.id,
                version: version.version,
                checksum: version.checksum,
                publishedAt: version.publishedAt.toISOString(),
                schema: version.schemaJson as TemplateDraftInput,
              }))
            : undefined,
        }
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value))

    return NextResponse.json({
      templates: results,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Impossibile recuperare i template.' },
      { status: 500 },
    )
  }
}
