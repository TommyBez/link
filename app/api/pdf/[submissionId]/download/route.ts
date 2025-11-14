import { type NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { requireStaff } from '@/lib/server/guard'

type RouteContext = {
  params: {
    submissionId: string
  }
}

export async function GET(
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
      where: (table, { and, eq }) =>
        and(eq(table.id, submissionId), eq(table.orgId, auth.orgId)),
      with: {
        pdfArtifact: true,
      },
    })

    if (!submission?.pdfArtifact) {
      return NextResponse.json(
        { error: 'PDF artifact not found.' },
        { status: 404 },
      )
    }

    if (
      submission.pdfArtifact.status !== 'ready' ||
      !submission.pdfArtifact.blobUrl
    ) {
      return NextResponse.json(
        { error: 'PDF non ancora disponibile.' },
        { status: 409 },
      )
    }

    return NextResponse.redirect(submission.pdfArtifact.blobUrl)
  } catch (error) {
    console.error('Failed to serve PDF download', error)
    return NextResponse.json(
      { error: 'Unable to download PDF.' },
      { status: 500 },
    )
  }
}
