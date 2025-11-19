import { eq } from 'drizzle-orm'
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

  console.log(
    `[Update PDF Artifact] Updating artifact for submission: ${submissionId}, Status: ${values.status}`,
  )

  const updated = await db
    .update(pdfArtifacts)
    .set(updatePayload)
    .where(eq(pdfArtifacts.submissionId, submissionId))
    .returning({ id: pdfArtifacts.id })

  if (updated.length === 0) {
    console.log(
      `[Update PDF Artifact] Creating new artifact record for submission: ${submissionId}`,
    )
    await db.insert(pdfArtifacts).values({
      submissionId,
      ...values,
      updatedAt: new Date(),
    })
  } else {
    console.log(
      `[Update PDF Artifact] Updated existing artifact record for submission: ${submissionId}`,
    )
  }
}
