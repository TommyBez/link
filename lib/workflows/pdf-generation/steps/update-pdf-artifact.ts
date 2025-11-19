import { db } from '@/lib/db'
import { pdfArtifacts } from '@/lib/db/schema'
import type { PdfArtifactUpdatableFields } from '@/lib/workflows/pdf-generation/types'

type UpdatePdfArtifactValues = Partial<
  Pick<PdfArtifactUpdatableFields, 'status' | 'error' | 'blobUrl' | 'sizeBytes'>
>

export async function updatePdfArtifact(
  submissionId: string,
  values: UpdatePdfArtifactValues,
): Promise<void> {
  'use step'

  const updatePayload: Partial<typeof pdfArtifacts.$inferInsert> = {
    ...values,
    updatedAt: new Date(),
  }

  await db
    .insert(pdfArtifacts)
    .values({
      submissionId,
      ...updatePayload,
    })
    .onConflictDoUpdate({
      target: pdfArtifacts.submissionId,
      set: updatePayload,
    })
}
