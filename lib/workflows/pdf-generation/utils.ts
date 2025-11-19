import { createPdfBuffer } from '@/lib/pdf/document'
import type { TemplateDraftInput } from '@/lib/templates/schema'
import type { SubmissionGraph } from '@/lib/workflows/pdf-generation/types'

export function buildPdfBuffer(submission: SubmissionGraph) {
  if (!submission) {
    console.error('[Build PDF Buffer] Submission not found')
    throw new Error('Submission not found')
  }

  const templateVersion = submission.templateVersion
  if (!templateVersion?.template) {
    console.error(
      `[Build PDF Buffer] Template data missing for submission: ${submission.id}`,
    )
    throw new Error('Template data is missing for this submission')
  }

  if (!submission.org) {
    console.error(
      `[Build PDF Buffer] Organization data missing for submission: ${submission.id}`,
    )
    throw new Error('Organization data is missing for this submission')
  }

  const schema = templateVersion.schemaJson as TemplateDraftInput

  console.log(
    `[Build PDF Buffer] Building PDF buffer for submission: ${submission.id}, Template: ${templateVersion.template.name}`,
  )
  return createPdfBuffer({
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
}
