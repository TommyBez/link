import { randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { intakeSessions, templates, templateVersions } from '@/lib/db/schema'
import { requireStaff } from '@/lib/server/guard'

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000

type PostBody = {
  templateVersionId?: string
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireStaff()
    const body = (await request.json()) as PostBody | undefined

    if (!body?.templateVersionId) {
      return NextResponse.json(
        { error: 'Il campo templateVersionId è obbligatorio.' },
        { status: 400 },
      )
    }

    const { templateVersionId } = body

    const [templateVersion] = await db
      .select({
        id: templateVersions.id,
        version: templateVersions.version,
        templateOrgId: templates.orgId,
        templateStatus: templates.status,
      })
      .from(templateVersions)
      .innerJoin(templates, eq(templateVersions.templateId, templates.id))
      .where(
        and(
          eq(templateVersions.id, templateVersionId),
          eq(templates.orgId, context.orgId),
          gt(templateVersions.version, 0),
          eq(templates.status, 'published'),
        ),
      )
      .limit(1)

    if (!templateVersion) {
      return NextResponse.json(
        { error: 'Template version non trovata o non pubblicata.' },
        { status: 404 },
      )
    }

    const expiresAt = new Date(Date.now() + THIRTY_DAYS_IN_MS)
    const token = randomBytes(24).toString('base64url')

    const [created] = await db
      .insert(intakeSessions)
      .values({
        orgId: context.orgId,
        templateVersionId,
        token,
        status: 'pending',
        expiresAt,
      })
      .returning({
        token: intakeSessions.token,
        expiresAt: intakeSessions.expiresAt,
      })

    return NextResponse.json(
      {
        token: created.token,
        expiresAt: created.expiresAt?.toISOString() ?? expiresAt.toISOString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Impossibile creare la sessione di intake.' },
      { status: 500 },
    )
  }
}
