'use client'

import { OrganizationProfile } from '@clerk/nextjs'

export default function UsersSettingsPage() {
  return (
    <main className="mx-auto max-w-[960px] px-4 py-10 pb-14">
      <header className="mb-8">
        <h1 className="font-semibold text-3xl">Team &amp; roles</h1>
        <p className="mt-2 text-gray-600 leading-relaxed">
          Manage members, invitations, and roles for your studio using
          Clerk&apos;s built-in organization tools.
        </p>
      </header>

      <OrganizationProfile path="/settings/users" />
    </main>
  )
}
