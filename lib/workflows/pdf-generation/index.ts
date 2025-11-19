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

  console.log(
    `[PDF Workflow] Starting PDF generation for submission: ${submissionId}`,
  )

  await updatePdfArtifact(submissionId, { status: 'generating' })

  console.log(`[PDF Workflow] Loading submission data: ${submissionId}`)

  const submission = await loadSubmission(submissionId)

  console.log(`[PDF Workflow] Submission loaded successfully: ${submissionId}`)

  console.log(`[PDF Workflow] Creating PDF buffer: ${submissionId}`)

  const pdfBuffer = await createPdfBufferStep(submissionId, submission)

  console.log(
    `[PDF Workflow] PDF buffer created successfully. Size: ${pdfBuffer.length} bytes`,
  )

  console.log(`[PDF Workflow] Uploading PDF: ${submissionId}`)

  const upload = await uploadPdf(submissionId, pdfBuffer)

  console.log(
    `[PDF Workflow] PDF uploaded successfully. URL: ${upload.url}, Size: ${pdfBuffer.length} bytes`,
  )

  await updatePdfArtifact(submissionId, {
    status: 'ready',
    blobUrl: upload.url,
    sizeBytes: pdfBuffer.length,
  })

  console.log(
    `[PDF Workflow] PDF generation completed successfully: ${submissionId}`,
  )

  return 'ok'
}
