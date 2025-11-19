import { createPdfBuffer } from '@/lib/pdf/document'
import type { TemplateDraftInput } from '@/lib/templates/schema'
import type { SubmissionGraph } from '@/lib/workflows/pdf-generation/types'

export async function createPdfBufferStep(
  submissionId: string,
  submission: SubmissionGraph,
) {
  'use step'
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

  console.log(
    `[Create PDF Buffer] Generating PDF buffer for submission: ${submissionId}, Template: ${templateVersion.template.name}, Has signature: ${!!submission.signature}`,
  )

  const pdfBuffer = await createPdfBuffer({
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
  })

  console.log(
    `[Create PDF Buffer] PDF buffer generated successfully. Size: ${pdfBuffer.length} bytes`,
  )

  return pdfBuffer
}
