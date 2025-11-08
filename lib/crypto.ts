import { createHash } from 'node:crypto'

export function hashPayloadSHA256(json: unknown): string {
  const normalized = JSON.stringify(
    json,
    Object.keys(json as Record<string, unknown>).sort(),
  )
  return createHash('sha256').update(normalized).digest('hex')
}
