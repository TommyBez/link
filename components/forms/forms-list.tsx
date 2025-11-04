import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Form = {
  id: string
  title: string
  description: string | null
  isActive: boolean
  updatedAt: Date
  submissionCount: number
}

type FormsListProps = {
  forms: Form[]
}

export function FormsList({ forms }: FormsListProps) {
  if (forms.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 font-medium text-gray-900 text-lg">No forms yet</h3>
        <p className="mt-2 text-gray-600 text-sm">
          Get started by creating your first consent form.
        </p>
        <Button asChild className="mt-6">
          <Link href="/forms/new">Create Form</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          key={form.id}
        >
          <div className="mb-4">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">
                {form.title}
              </h3>
              <span
                className={`rounded-full px-2 py-1 font-medium text-xs ${
                  form.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {form.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {form.description && (
              <p className="line-clamp-2 text-gray-600 text-sm">
                {form.description}
              </p>
            )}
          </div>

          <div className="mb-4 flex items-center gap-4 text-gray-500 text-sm">
            <span>{form.submissionCount} submissions</span>
            <span>•</span>
            <span>
              Updated{' '}
              {formatDistanceToNow(new Date(form.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              asChild
              className="flex-1 bg-transparent"
              size="sm"
              variant="outline"
            >
              <Link href={`/forms/${form.id}/edit`}>Edit</Link>
            </Button>
            <Button
              asChild
              className="flex-1 bg-transparent"
              size="sm"
              variant="outline"
            >
              <Link href={`/forms/${form.id}/submissions`}>
                <ExternalLink className="mr-1 h-3 w-3" />
                View
              </Link>
            </Button>
          </div>

          <div className="mt-3 rounded bg-gray-50 p-2">
            <p className="text-gray-600 text-xs">Share link:</p>
            <code className="mt-1 block truncate text-blue-600 text-xs">
              {typeof window !== 'undefined' ? window.location.origin : ''}
              /submit/{form.id}
            </code>
          </div>
        </div>
      ))}
    </div>
  )
}
