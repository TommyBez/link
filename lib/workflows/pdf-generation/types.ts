import type { pdfArtifacts } from '@/lib/db/schema'

import type { loadSubmission } from '@/lib/workflows/pdf-generation/steps/load-submission'

export type SubmissionGraph = Awaited<ReturnType<typeof loadSubmission>>

export type PdfArtifactUpdatableFields = Omit<
  typeof pdfArtifacts.$inferInsert,
  'id' | 'submissionId' | 'createdAt' | 'updatedAt'
>
