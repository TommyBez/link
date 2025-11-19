import { db } from '@/lib/db'

export async function loadSubmission(submissionId: string) {
  'use step'

  const submission = await db.query.submissions.findFirst({
    where: (table, { eq: equals }) => equals(table.id, submissionId),
    with: {
      org: true,
      templateVersion: {
        with: {
          template: true,
        },
      },
      signature: true,
    },
  })

  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`)
  }

  return submission
}
