import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { FileText, ExternalLink } from "lucide-react"

interface Submission {
  id: string
  clientName: string
  clientEmail: string
  submittedAt: Date
  formTitle: string | null
  pdfUrl: string | null
}

interface RecentSubmissionsProps {
  submissions: Submission[]
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No submissions yet</h3>
        <p className="mt-2 text-sm text-gray-600">Create a form and share it with clients to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
          <Link href="/submissions" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View All →
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {submissions.map((submission) => (
          <Link
            key={submission.id}
            href={`/submissions/${submission.id}`}
            className="block px-6 py-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-gray-900">{submission.clientName}</p>
                  <span className="text-sm text-gray-500">-</span>
                  <p className="text-sm text-gray-600">{submission.formTitle}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
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
