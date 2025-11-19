import { db } from '@/lib/db'
import { type PdfArtifactStatus, pdfArtifacts } from '@/lib/db/schema'

type PdfArtifactMetaInput = {
  status: PdfArtifactStatus
  workflowRunId?: string | null
  error?: string | null
}

export async function upsertPdfArtifactMeta(
  submissionId: string,
  values: PdfArtifactMetaInput,
): Promise<void> {
  const payload = {
    status: values.status,
    workflowRunId: values.workflowRunId ?? null,
    error: values.error ?? null,
    updatedAt: new Date(),
  }

  await db
    .insert(pdfArtifacts)
    .values({
      submissionId,
      ...payload,
    })
    .onConflictDoUpdate({
      target: pdfArtifacts.submissionId,
      set: payload,
    })
}
