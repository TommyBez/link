import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

type DashboardHeaderProps = {
  organizationName: string
}

export function DashboardHeader({ organizationName }: DashboardHeaderProps) {
  return (
    <header className="border-gray-200 border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-2" href="/dashboard">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="font-bold text-lg text-white">L</span>
              </div>
              <span className="font-semibold text-gray-900 text-xl">Link</span>
            </Link>

            <nav className="hidden md:flex md:gap-6">
              <Link
                className="font-medium text-gray-700 text-sm hover:text-gray-900"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className="font-medium text-gray-700 text-sm hover:text-gray-900"
                href="/forms"
              >
                Forms
              </Link>
              <Link
                className="font-medium text-gray-700 text-sm hover:text-gray-900"
                href="/submissions"
              >
                Submissions
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">{organizationName}</span>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
    </header>
  )
}
