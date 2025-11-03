import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye } from "lucide-react"

interface Submission {
  id: string
  clientName: string
  clientEmail: string
  submittedAt: Date
  formTitle: string | null
  pdfUrl: string | null
}

interface SubmissionsListProps {
  submissions: Submission[]
}

export function SubmissionsList({ submissions }: SubmissionsListProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No submissions yet</h3>
        <p className="mt-2 text-sm text-gray-600">Submissions will appear here once clients complete your forms.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{submission.clientName}</h3>
              <p className="mt-1 text-sm text-gray-600">{submission.clientEmail}</p>
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <span>{submission.formTitle}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/submissions/${submission.id}`}>
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Link>
              </Button>
              {submission.pdfUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={submission.pdfUrl} target="_blank" rel="noopener noreferrer">
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
