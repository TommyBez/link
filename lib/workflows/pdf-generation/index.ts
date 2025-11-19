import { createPdfBufferStep } from './steps/create-pdf-buffer'
import { loadSubmission } from './steps/load-submission'
import { updatePdfArtifact } from './steps/update-pdf-artifact'
import { uploadPdf } from './steps/upload-pdf'

export type GeneratePdfWorkflowResult = {
  blobUrl: string
  sizeBytes: number
}

export async function generatePdfWorkflow(submissionId: string) {
  'use workflow'

  await updatePdfArtifact(submissionId, { status: 'generating' })

  const submission = await loadSubmission(submissionId)
  const pdfBuffer = await createPdfBufferStep(submission)
  const upload = await uploadPdf(submissionId, pdfBuffer)

  await updatePdfArtifact(submissionId, {
    status: 'ready',
    blobUrl: upload.url,
    sizeBytes: pdfBuffer.length,
  })

  return 'ok'
}
