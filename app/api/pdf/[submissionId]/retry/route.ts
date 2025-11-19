import { type NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { db } from '@/lib/db'
import { upsertPdfArtifactMeta } from '@/lib/pdf/artifacts'
import { requireStaff } from '@/lib/server/guard'
import { generatePdfWorkflow } from '@/lib/workflows/pdf-generation'

export async function POST(
  _request: NextRequest,
  { params }: RouteContext<'/api/pdf/[submissionId]/retry'>,
): Promise<NextResponse> {
  try {
    const auth = await requireStaff()
    const { submissionId } = await params

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId parameter.' },
        { status: 400 },
      )
    }

    const submission = await db.query.submissions.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.id, submissionId), eq(table.orgId, auth.orgId)),
      with: {
        pdfArtifact: true,
      },
    })

    if (!submission?.pdfArtifact) {
      return NextResponse.json(
        { error: 'PDF artifact not found for this submission.' },
        { status: 404 },
      )
    }

    if (submission.pdfArtifact.status !== 'failed') {
      return NextResponse.json(
        {
          status: submission.pdfArtifact.status,
          error: 'Retry is only available for failed generations.',
        },
        { status: 409 },
      )
    }

    const run = await start(generatePdfWorkflow, [submissionId])
    await upsertPdfArtifactMeta(submissionId, {
      status: 'queued',
      workflowRunId: run.runId,
      error: null,
    })

    return NextResponse.json(
      {
        status: 'queued',
        workflowRunId: run.runId,
      },
      { status: 202 },
    )
  } catch (error) {
    console.error('Failed to retry PDF generation', error)
    return NextResponse.json(
      { error: 'Unable to retry PDF generation.' },
      { status: 500 },
    )
  }
}
