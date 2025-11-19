import { putPdf } from '@/lib/storage/blob'

export async function uploadPdf(submissionId: string, pdfBuffer: Buffer) {
  'use step'

  const result = await putPdf(`${submissionId}.pdf`, pdfBuffer)
  return result
}
