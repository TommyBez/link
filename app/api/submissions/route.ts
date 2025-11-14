import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { intakeSessions, signatures, submissions } from '@/lib/db/schema'
import { putSignature } from '@/lib/storage/blob'
import type { FieldInput, TemplateDraftInput } from '@/lib/templates/schema'

type SubmissionPayload = {
  token?: unknown
  responses?: unknown
  signature?: unknown
}

type SignaturePayload = {
  dataUrl: string
  signerName?: string
  signedAtClientUtc?: string
}

function isExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) {
    return false
  }
  return expiresAt.getTime() <= Date.now()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

function coerceCheckbox(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'on'
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return Boolean(value)
}

function sanitizeFieldValue(field: FieldInput, value: unknown): unknown {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'textarea':
    case 'date': {
      return coerceString(value) ?? ''
    }
    case 'checkbox': {
      return coerceCheckbox(value)
    }
    case 'radio': {
      if (typeof value !== 'string') {
        return ''
      }
      const trimmed = value.trim()
      const valid = field.options.some((option) => option.id === trimmed)
      return valid ? trimmed : ''
    }
    case 'signature': {
      if (isRecord(value) && typeof value.dataUrl === 'string') {
        return value
      }
      return null
    }
    default:
      return value ?? ''
  }
}

function ensureRequiredFields(
  fields: TemplateDraftInput['fields'],
  responses: Record<string, unknown>,
  signature: SignaturePayload | null,
): string[] {
  const missing: string[] = []

  for (const field of fields) {
    if (field.type === 'content') {
      continue
    }
    if (!field.required) {
      continue
    }
    const currentValue = responses[field.id]
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'textarea':
      case 'date':
      case 'radio': {
        if (typeof currentValue !== 'string' || currentValue.length === 0) {
          missing.push(field.label)
        }
        break
      }
      case 'checkbox': {
        if (!coerceCheckbox(currentValue)) {
          missing.push(field.label)
        }
        break
      }
      case 'signature': {
        if (!signature || typeof signature.dataUrl !== 'string') {
          missing.push(field.label)
        }
        break
      }
      default:
        break
    }
  }

  return missing
}

function parseSignaturePayload(input: unknown): SignaturePayload | null {
  if (!isRecord(input)) {
    return null
  }
  const dataUrl = typeof input.dataUrl === 'string' ? input.dataUrl : null
  if (!dataUrl) {
    return null
  }
  const signerName =
    typeof input.signerName === 'string' ? input.signerName.trim() : undefined
  const signedAtClientUtc =
    typeof input.signedAtClientUtc === 'string'
      ? input.signedAtClientUtc
      : undefined
  return {
    dataUrl,
    signerName,
    signedAtClientUtc,
  }
}

function extractDataUrl(dataUrl: string): {
  buffer: Buffer
  contentType: string
} {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/u)
  if (!matches) {
    throw new Error('Formato della firma non valido.')
  }
  const [, mime, encoded] = matches
  if (!(mime && encoded)) {
    throw new Error('Formato della firma non valido.')
  }
  const contentType = mime
  if (contentType !== 'image/png') {
    throw new Error('La firma deve essere in formato PNG.')
  }
  const buffer = Buffer.from(encoded, 'base64')
  return { buffer, contentType }
}

function findField(
  fields: TemplateDraftInput['fields'],
  predicate: (field: FieldInput) => boolean,
): FieldInput | null {
  return fields.find(predicate) ?? null
}

function inferRespondentName(
  fields: TemplateDraftInput['fields'],
  responses: Record<string, unknown>,
): string | null {
  const field =
    findField(
      fields,
      (item) =>
        item.type === 'text' &&
        (item.id.toLowerCase().includes('name') ||
          item.id.toLowerCase().includes('nome') ||
          item.label.toLowerCase().includes('name') ||
          item.label.toLowerCase().includes('nome')),
    ) ?? null
  if (!field) {
    return null
  }
  return coerceString(responses[field.id])
}

function inferEmail(
  fields: TemplateDraftInput['fields'],
  responses: Record<string, unknown>,
): string | null {
  const field = findField(fields, (item) => item.type === 'email')
  if (!field) {
    return null
  }
  return coerceString(responses[field.id])
}

function inferPhone(
  fields: TemplateDraftInput['fields'],
  responses: Record<string, unknown>,
): string | null {
  const field = findField(fields, (item) => item.type === 'phone')
  if (!field) {
    return null
  }
  return coerceString(responses[field.id])
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SubmissionPayload
    if (!isRecord(payload)) {
      return NextResponse.json(
        { error: 'Payload non valido.' },
        { status: 400 },
      )
    }

    const token = typeof payload.token === 'string' ? payload.token : null
    if (!token) {
      return NextResponse.json(
        { error: 'Token della sessione mancante.' },
        { status: 400 },
      )
    }

    if (!isRecord(payload.responses)) {
      return NextResponse.json(
        { error: 'Risposte non valide.' },
        { status: 400 },
      )
    }

    const signaturePayload = parseSignaturePayload(payload.signature ?? null)

    const session = await db.query.intakeSessions.findFirst({
      where: (sessionTable, { eq: equals }) =>
        equals(sessionTable.token, token),
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

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Questa sessione è già stata completata.' },
        { status: 409 },
      )
    }

    if (isExpired(session.expiresAt)) {
      return NextResponse.json(
        {
          error: 'La sessione è scaduta.',
          status: 'expired',
          expiresAt: session.expiresAt.toISOString(),
        },
        { status: 410 },
      )
    }

    const schema = session.templateVersion.schemaJson as TemplateDraftInput
    const rawResponses = payload.responses as Record<string, unknown>
    const sanitizedResponses: Record<string, unknown> = {}

    for (const field of schema.fields) {
      if (field.type === 'content') {
        continue
      }
      const value = rawResponses[field.id]
      sanitizedResponses[field.id] = sanitizeFieldValue(field, value)
    }

    const missingFields = ensureRequiredFields(
      schema.fields,
      sanitizedResponses,
      signaturePayload,
    )

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Compila tutti i campi obbligatori.',
          missing: missingFields,
        },
        { status: 400 },
      )
    }

    let signatureFile: { buffer: Buffer; contentType: string } | null = null
    if (signaturePayload) {
      try {
        signatureFile = extractDataUrl(signaturePayload.dataUrl)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Firma non valida.'
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    const respondentName = inferRespondentName(
      schema.fields,
      sanitizedResponses,
    )
    const respondentEmail = inferEmail(schema.fields, sanitizedResponses)
    const respondentPhone = inferPhone(schema.fields, sanitizedResponses)

    const submissionId = await db.transaction(async (tx) => {
      const [submission] = await tx
        .insert(submissions)
        .values({
          intakeSessionId: session.id,
          templateVersionId: session.templateVersionId,
          orgId: session.orgId,
          status: 'submitted',
          submittedAt: new Date(),
          responseData: sanitizedResponses,
          respondentName,
          respondentEmail,
          respondentPhone,
        })
        .returning({ id: submissions.id })

      if (!submission) {
        throw new Error('Impossibile creare la sottomissione.')
      }

      let blobUrl: string | null = null
      let signerName: string | undefined = signaturePayload?.signerName
      if (signaturePayload && signatureFile) {
        const uploadResult = await putSignature(
          `${submission.id}.png`,
          signatureFile.buffer,
          signatureFile.contentType,
        )
        blobUrl = uploadResult.url
        if (!signerName) {
          signerName = respondentName ?? 'Firmatario'
        }
        await tx.insert(signatures).values({
          submissionId: submission.id,
          signerName: signerName ?? 'Firmatario',
          signedAtUtc: new Date(),
          ipAddress: extractClientIp(request),
          userAgent: request.headers.get('user-agent'),
          blobUrl,
        })
      }

      await tx
        .update(intakeSessions)
        .set({ status: 'completed' })
        .where(eq(intakeSessions.id, session.id))

      return submission.id
    })

    return NextResponse.json(
      {
        submissionId,
        message: 'Modulo inviato correttamente.',
      },
      { status: 201 },
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Impossibile registrare la sottomissione.' },
      { status: 500 },
    )
  }
}

function extractClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (!forwarded) {
    return null
  }
  const [ip] = forwarded.split(',').map((item) => item.trim())
  return ip ?? null
}
