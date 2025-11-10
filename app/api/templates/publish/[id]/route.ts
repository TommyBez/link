import { desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { hashPayloadSHA256 } from '@/lib/crypto'
import { db } from '@/lib/db'
import { templates, templateVersions } from '@/lib/db/schema'
import { requireStaff } from '@/lib/server/guard'
import { templateDraft } from '@/lib/templates/schema'

type PublishBody = {
  template: unknown
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/api/templates/publish/[id]'>,
) {
  try {
    const context = await requireStaff()
    const { id: templateId } = await params
    const body = (await request.json()) as PublishBody | undefined

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

    const templateRow = await db.query.templates.findFirst({
      where: (t, { and, eq: eqWhere }) =>
        and(eqWhere(t.id, templateId), eqWhere(t.orgId, context.orgId)),
    })

    if (!templateRow) {
      return NextResponse.json(
        { error: 'Template non trovato.' },
        { status: 404 },
      )
    }

    const payload = parsed.data
    const checksum = hashPayloadSHA256(payload)
    const now = new Date()

    const publishedVersions = await db
      .select({
        id: templateVersions.id,
        version: templateVersions.version,
        checksum: templateVersions.checksum,
        publishedAt: templateVersions.publishedAt,
      })
      .from(templateVersions)
      .where(eq(templateVersions.templateId, templateId))
      .orderBy(desc(templateVersions.version))

    const latestPublished =
      publishedVersions.find((version) => version.version > 0) ?? null

    if (latestPublished && latestPublished.checksum === checksum) {
      return NextResponse.json(
        {
          version: latestPublished.version,
          publishedAt: latestPublished.publishedAt.toISOString(),
        },
        { status: 200 },
      )
    }

    const nextVersion = (latestPublished?.version ?? 0) + 1

    await db.insert(templateVersions).values({
      templateId,
      version: nextVersion,
      schemaJson: payload,
      checksum,
      publishedAt: now,
    })

    await db
      .update(templates)
      .set({
        status: 'published',
        name: payload.name,
        updatedAt: now,
      })
      .where(eq(templates.id, templateId))

    return NextResponse.json(
      {
        version: nextVersion,
        publishedAt: now.toISOString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Impossibile pubblicare il template.' },
      { status: 500 },
    )
  }
}
