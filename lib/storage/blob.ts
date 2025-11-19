import { put } from '@vercel/blob'
import { env } from '../env'

export function putSignature(
  name: string,
  file: Blob | Buffer,
  contentType: string,
) {
  const blob = file instanceof Blob ? file : new Blob([new Uint8Array(file)])
  return put(`signatures/${name}`, blob, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
    contentType,
    addRandomSuffix: false,
  })
}

export function putPdf(name: string, file: Buffer) {
  return put(`pdfs/${name}`, file, {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
    contentType: 'application/pdf',
  })
}
