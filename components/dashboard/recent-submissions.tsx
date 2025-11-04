import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'

type Submission = {
  id: string
  clientName: string
  clientEmail: string
  submittedAt: Date
  formTitle: string | null
  pdfUrl: string | null
}

type RecentSubmissionsProps = {
  submissions: Submission[]
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 font-medium text-gray-900 text-lg">
          No submissions yet
        </h3>
        <p className="mt-2 text-gray-600 text-sm">
          Create a form and share it with clients to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-gray-200 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-lg">
            Recent Submissions
          </h2>
          <Link
            className="font-medium text-blue-600 text-sm hover:text-blue-700"
            href="/submissions"
          >
            View All →
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {submissions.map((submission) => (
          <Link
            className="block px-6 py-4 transition-colors hover:bg-gray-50"
            href={`/submissions/${submission.id}`}
            key={submission.id}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-gray-900">
                    {submission.clientName}
                  </p>
                  <span className="text-gray-500 text-sm">-</span>
                  <p className="text-gray-600 text-sm">
                    {submission.formTitle}
                  </p>
                </div>
                <p className="mt-1 text-gray-500 text-sm">
                  {formatDistanceToNow(new Date(submission.submittedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
