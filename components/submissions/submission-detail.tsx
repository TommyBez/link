import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"

interface Submission {
  id: string
  clientName: string
  clientEmail: string
  submittedAt: Date
  pdfUrl: string | null
  formTitle: string | null
  formId: string | null
}

interface Answer {
  fieldId: string
  fieldType: string
  label: string
  answer: string
}

interface SubmissionDetailProps {
  submission: Submission
  answers: Answer[]
}

export function SubmissionDetail({ submission, answers }: SubmissionDetailProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/submissions" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Link>
        {submission.pdfUrl && (
          <Button asChild className="gap-2">
            <a href={submission.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Client Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.clientName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.clientEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                <dd className="mt-1 text-sm text-gray-900">{format(new Date(submission.submittedAt), "PPpp")}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Form</dt>
                <dd className="mt-1 text-sm text-gray-900">{submission.formTitle}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Completed
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Form Responses</h2>
            <div className="space-y-6">
              {answers.map((answer) => (
                <div key={answer.fieldId} className="border-b border-gray-100 pb-4 last:border-0">
                  <dt className="text-sm font-medium text-gray-700">{answer.label}</dt>
                  {answer.fieldType === "signature" && answer.answer ? (
                    <dd className="mt-2">
                      <img
                        src={answer.answer || "/placeholder.svg"}
                        alt="Signature"
                        className="h-24 rounded border border-gray-200"
                      />
                    </dd>
                  ) : (
                    <dd className="mt-2 text-sm text-gray-900">{answer.answer || "(No answer provided)"}</dd>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
