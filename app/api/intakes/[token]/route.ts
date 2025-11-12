import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { TemplateDraftInput } from '@/lib/templates/schema'

type RouteParams = { token: string } | Promise<{ token: string }>

type GetContext = {
  params: RouteParams
}

function isExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) {
    return false
  }
  return expiresAt.getTime() <= Date.now()
}

function extractPrefill(
  searchParams: URLSearchParams,
  schema: TemplateDraftInput,
): Record<string, string> {
  const allowedIds = new Set(schema.fields.map((field) => field.id))
  const prefill: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    if (!allowedIds.has(key)) {
      continue
    }
    prefill[key] = value
  }

  return prefill
}

export async function GET(request: NextRequest, { params }: GetContext) {
  try {
    const { token } = await params

    const session = await db.query.intakeSessions.findFirst({
      where: (sessionTable, { eq }) => eq(sessionTable.token, token),
      with: {
        templateVersion: {
          with: {
            template: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sessione di intake non trovata.' },
        { status: 404 },
      )
    }

    if (isExpired(session.expiresAt)) {
      return NextResponse.json(
        {
          status: 'expired',
          expiresAt: session.expiresAt.toISOString(),
        },
        { status: 410 },
      )
    }

    const templateVersion = session.templateVersion
    const template = templateVersion.template

    if (template.orgId !== session.orgId) {
      return NextResponse.json(
        { error: 'Sessione di intake non valida per questa organizzazione.' },
        { status: 404 },
      )
    }

    const schema = templateVersion.schemaJson as TemplateDraftInput
    const prefill = extractPrefill(request.nextUrl.searchParams, schema)

    return NextResponse.json({
      status: session.status,
      expiresAt: session.expiresAt.toISOString(),
      template: {
        id: templateVersion.templateId,
        version: templateVersion.version,
        title: template.name,
        schema,
        branding: schema.branding ?? null,
      },
      prefill,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Impossibile recuperare la sessione di intake.' },
      { status: 500 },
    )
  }
}
