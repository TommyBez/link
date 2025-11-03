import { UserButton } from "@clerk/nextjs"
import Link from "next/link"

interface DashboardHeaderProps {
  organizationName: string
}

export function DashboardHeader({ organizationName }: DashboardHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-lg font-bold text-white">L</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Link</span>
            </Link>

            <nav className="hidden md:flex md:gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/forms" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Forms
              </Link>
              <Link href="/submissions" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Submissions
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{organizationName}</span>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
    </header>
  )
}
