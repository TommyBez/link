import { formatDistanceToNow } from 'date-fns'
import { Download, Eye, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Submission = {
  id: string
  clientName: string
  clientEmail: string
  submittedAt: Date
  formTitle: string | null
  pdfUrl: string | null
}

type SubmissionsListProps = {
  submissions: Submission[]
}

export function SubmissionsList({ submissions }: SubmissionsListProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 font-medium text-gray-900 text-lg">
          No submissions yet
        </h3>
        <p className="mt-2 text-gray-600 text-sm">
          Submissions will appear here once clients complete your forms.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          key={submission.id}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {submission.clientName}
              </h3>
              <p className="mt-1 text-gray-600 text-sm">
                {submission.clientEmail}
              </p>
              <div className="mt-2 flex items-center gap-3 text-gray-500 text-sm">
                <span>{submission.formTitle}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(submission.submittedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/submissions/${submission.id}`}>
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Link>
              </Button>
              {submission.pdfUrl && (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={submission.pdfUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
