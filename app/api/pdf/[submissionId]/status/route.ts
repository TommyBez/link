import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/server/guard'

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<'/api/pdf/[submissionId]/status'>,
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
      columns: {
        id: true,
      },
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

    if (!artifact) {
      return NextResponse.json(
        {
          status: 'not_started',
        },
        { status: 200 },
      )
    }

    return NextResponse.json(
      {
        status: artifact.status,
        workflowRunId: artifact.workflowRunId,
        blobUrl: artifact.blobUrl,
        sizeBytes: artifact.sizeBytes,
        error: artifact.error,
        updatedAt: artifact.updatedAt,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Failed to read PDF generation status', error)
    return NextResponse.json(
      { error: 'Unable to fetch PDF status.' },
      { status: 500 },
    )
  }
}
