import { format } from 'date-fns'
import { ArrowLeft, Download } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Submission = {
  id: string
  clientName: string
  clientEmail: string
  submittedAt: Date
  pdfUrl: string | null
  formTitle: string | null
  formId: string | null
}

type Answer = {
  fieldId: string
  fieldType: string
  label: string
  answer: string
}

type SubmissionDetailProps = {
  submission: Submission
  answers: Answer[]
}

export function SubmissionDetail({
  submission,
  answers,
}: SubmissionDetailProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-900"
          href="/submissions"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Link>
        {submission.pdfUrl && (
          <Button asChild className="gap-2">
            <a
              href={submission.pdfUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900 text-lg">
              Client Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="font-medium text-gray-500 text-sm">Name</dt>
                <dd className="mt-1 text-gray-900 text-sm">
                  {submission.clientName}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-sm">Email</dt>
                <dd className="mt-1 text-gray-900 text-sm">
                  {submission.clientEmail}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-sm">Submitted</dt>
                <dd className="mt-1 text-gray-900 text-sm">
                  {format(new Date(submission.submittedAt), 'PPpp')}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-sm">Form</dt>
                <dd className="mt-1 text-gray-900 text-sm">
                  {submission.formTitle}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 text-sm">Status</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800 text-xs">
                    Completed
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-6 font-semibold text-gray-900 text-lg">
              Form Responses
            </h2>
            <div className="space-y-6">
              {answers.map((answer) => (
                <div
                  className="border-gray-100 border-b pb-4 last:border-0"
                  key={answer.fieldId}
                >
                  <dt className="font-medium text-gray-700 text-sm">
                    {answer.label}
                  </dt>
                  {answer.fieldType === 'signature' && answer.answer ? (
                    <dd className="mt-2">
                      <Image
                        alt="Signature"
                        className="h-24 rounded border border-gray-200"
                        height={100}
                        src={answer.answer || '/placeholder.svg'}
                        width={100}
                      />
                    </dd>
                  ) : (
                    <dd className="mt-2 text-gray-900 text-sm">
                      {answer.answer || '(No answer provided)'}
                    </dd>
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
