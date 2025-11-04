import { FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 font-semibold text-gray-900 text-lg">
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link className="gap-2" href="/forms/new">
            <Plus className="h-4 w-4" />
            Create New Form
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link className="gap-2" href="/forms">
            <FileText className="h-4 w-4" />
            View All Forms
          </Link>
        </Button>
      </div>
    </div>
  )
}
