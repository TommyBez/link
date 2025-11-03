import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/forms/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Form
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/forms" className="gap-2">
            <FileText className="h-4 w-4" />
            View All Forms
          </Link>
        </Button>
      </div>
    </div>
  )
}
