import { notFound } from 'next/navigation'

import { db } from '@/lib/db'
import { requireStaff } from '@/lib/server/guard'

import { PdfPanel, type PdfStatusState } from './components/pdf-panel'

type PageProps = {
  params: {
    id: string
  }
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const auth = await requireStaff()
  const submission = await db.query.submissions.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.id, params.id), eq(table.orgId, auth.orgId)),
    with: {
      pdfArtifact: true,
    },
  })

  if (!submission) {
    notFound()
  }

  const initialStatus: PdfStatusState = submission.pdfArtifact
    ? {
        status: submission.pdfArtifact.status,
        workflowRunId: submission.pdfArtifact.workflowRunId,
        blobUrl: submission.pdfArtifact.blobUrl,
        sizeBytes: submission.pdfArtifact.sizeBytes,
        checksum: submission.pdfArtifact.checksum,
        error: submission.pdfArtifact.error,
      }
    : { status: 'not_started' }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground text-sm">ID sottomissione</p>
        <h1 className="font-semibold text-2xl tracking-tight">
          {submission.id}
        </h1>
      </div>

      <PdfPanel initialStatus={initialStatus} submissionId={submission.id} />
    </div>
  )
}
