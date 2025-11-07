import { put } from '@vercel/blob'
import { env } from '../env'

export function putSignature(
  name: string,
  file: Blob | Buffer,
  contentType: string,
) {
  return put(`signatures/${name}`, file as Blob, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
    contentType,
    addRandomSuffix: false,
  })
}

export function putPdf(name: string, file: Buffer) {
  return put(`pdfs/${name}`, file as unknown as Blob, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
    contentType: 'application/pdf',
    addRandomSuffix: false,
  })
}
