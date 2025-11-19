import { putPdf } from '@/lib/storage/blob'

export async function uploadPdf(submissionId: string, pdfBuffer: Buffer) {
  'use step'
  console.log('[Upload PDF] Uploading PDF to blob storage...')

  const result = await putPdf(`${submissionId}.pdf`, pdfBuffer)
  console.log(`[Upload PDF] PDF uploaded successfully. Blob URL: ${result.url}`)
  return result
}
