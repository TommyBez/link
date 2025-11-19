import { type NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { db } from '@/lib/db'
import { upsertPdfArtifactMeta } from '@/lib/pdf/artifacts'
import { requireStaff } from '@/lib/server/guard'
import { generatePdfWorkflow } from '@/lib/workflows/pdf-generation'

type RouteContext = {
  params: {
    submissionId: string
  }
}

export async function POST(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const auth = await requireStaff()
    const submissionId = params.submissionId

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId parameter.' },
        { status: 400 },
      )
    }

    const submission = await db.query.submissions.findFirst({
      where: (table, { and, eq: equals }) =>
        and(equals(table.id, submissionId), equals(table.orgId, auth.orgId)),
      with: {
        pdfArtifact: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found.' },
        { status: 404 },
      )
    }

    const artifact = submission.pdfArtifact

    if (artifact) {
      switch (artifact.status) {
        case 'ready':
          return NextResponse.json(
            {
              status: artifact.status,
              workflowRunId: artifact.workflowRunId,
              blobUrl: artifact.blobUrl,
              sizeBytes: artifact.sizeBytes,
            },
            { status: 200 },
          )
        case 'failed':
          return NextResponse.json(
            {
              status: artifact.status,
              workflowRunId: artifact.workflowRunId,
              error: artifact.error ?? 'PDF generation failed.',
              message: 'Use the retry action to start a new workflow run.',
            },
            { status: 409 },
          )
        case 'queued':
        case 'generating':
          return NextResponse.json(
            {
              status: artifact.status,
              workflowRunId: artifact.workflowRunId,
            },
            { status: 200 },
          )
        default:
          break
      }
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
    console.error('Failed to enqueue PDF generation', error)
    return NextResponse.json(
      { error: 'Unable to enqueue PDF generation.' },
      { status: 500 },
    )
  }
}
