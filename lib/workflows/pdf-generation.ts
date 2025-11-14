import { createHash } from 'node:crypto'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { type PdfArtifactStatus, pdfArtifacts } from '@/lib/db/schema'
import { createPdfBuffer, type SubmissionPdfPayload } from '@/lib/pdf/document'
import { putPdf } from '@/lib/storage/blob'
import type { TemplateDraftInput } from '@/lib/templates/schema'

type SubmissionGraph = Awaited<ReturnType<typeof loadSubmission>>

type PdfArtifactUpdatableFields = Omit<
  typeof pdfArtifacts.$inferInsert,
  'id' | 'submissionId' | 'createdAt' | 'updatedAt'
>

export type GeneratePdfWorkflowResult = {
  blobUrl: string
  sizeBytes: number
  checksum: string
}

export async function generatePdfWorkflow(submissionId: string) {
  'use workflow'

  await updatePdfArtifact(submissionId, { status: 'generating', error: null })

  try {
    const submission = await loadSubmission(submissionId)
    if (!submission) {
      throw new Error('Submission not found')
    }

    const payload = buildPdfPayload(submission)
    const pdfBuffer = await renderPdf(payload)
    const upload = await uploadPdf(submissionId, pdfBuffer)
    const checksum = createHash('sha256').update(pdfBuffer).digest('hex')

    await updatePdfArtifact(submissionId, {
      status: 'ready',
      blobUrl: upload.url,
      sizeBytes: pdfBuffer.length,
      checksum,
      error: null,
    })

    return {
      blobUrl: upload.url,
      sizeBytes: pdfBuffer.length,
      checksum,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'PDF generation failed'
    await updatePdfArtifact(submissionId, {
      status: 'failed',
      error: message,
    })
    throw error
  }
}

async function loadSubmission(submissionId: string) {
  'use step'

  return await db.query.submissions.findFirst({
    where: (table, { eq: equals }) => equals(table.id, submissionId),
    with: {
      org: true,
      templateVersion: {
        with: {
          template: true,
        },
      },
      signature: true,
    },
  })
}

function renderPdf(payload: SubmissionPdfPayload) {
  'use step'
  return createPdfBuffer(payload)
}

async function uploadPdf(submissionId: string, pdfBuffer: Buffer) {
  'use step'
  return await putPdf(`${submissionId}.pdf`, pdfBuffer)
}

async function updatePdfArtifact(
  submissionId: string,
  values: Partial<PdfArtifactUpdatableFields>,
  defaultStatus: PdfArtifactStatus = 'queued',
) {
  'use step'

  const sanitized = stripUndefined(values)
  const { status, ...rest } = sanitized as {
    status?: PdfArtifactStatus
  } & Partial<Omit<PdfArtifactUpdatableFields, 'status'>>
  const now = new Date()

  const updatePayload: Partial<typeof pdfArtifacts.$inferInsert> = {
    ...rest,
    updatedAt: now,
  }
  if (status) {
    updatePayload.status = status
  }

  const updated = await db
    .update(pdfArtifacts)
    .set(updatePayload)
    .where(eq(pdfArtifacts.submissionId, submissionId))
    .returning({ id: pdfArtifacts.id })

  if (updated.length === 0) {
    await db.insert(pdfArtifacts).values({
      submissionId,
      status: status ?? defaultStatus,
      ...rest,
      updatedAt: now,
    })
  }
}

function buildPdfPayload(submission: SubmissionGraph): SubmissionPdfPayload {
  if (!submission) {
    throw new Error('Submission not found')
  }

  const templateVersion = submission.templateVersion
  if (!templateVersion?.template) {
    throw new Error('Template data is missing for this submission')
  }

  if (!submission.org) {
    throw new Error('Organization data is missing for this submission')
  }

  const schema = templateVersion.schemaJson as TemplateDraftInput

  return {
    submission: {
      id: submission.id,
      createdAt: submission.createdAt,
      submittedAt: submission.submittedAt,
      responseData: submission.responseData as Record<string, unknown> | null,
      respondentName: submission.respondentName,
      respondentEmail: submission.respondentEmail,
      respondentPhone: submission.respondentPhone,
    },
    template: {
      name: templateVersion.template.name,
      version: templateVersion.version,
      schema,
    },
    org: {
      name: submission.org.name,
    },
    signature: submission.signature
      ? {
          signerName: submission.signature.signerName,
          signedAtUtc: submission.signature.signedAtUtc,
          ipAddress: submission.signature.ipAddress,
          userAgent: submission.signature.userAgent,
          blobUrl: submission.signature.blobUrl,
        }
      : undefined,
  }
}

function stripUndefined<T extends Record<string, unknown>>(
  data: Partial<T>,
): Partial<T> {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key as keyof T] = value as T[keyof T]
    }
  }
  return result
}
