'use client'

import { OrganizationProfile } from '@clerk/nextjs'

export default function UsersSettingsPage() {
  return (
    <main
      style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 1rem 3.5rem' }}
    >
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Team &amp; roles</h1>
        <p style={{ marginTop: '0.5rem', color: '#4b5563', lineHeight: 1.6 }}>
          Manage members, invitations, and roles for your studio using
          Clerk&apos;s built-in organization tools.
        </p>
      </header>

      <OrganizationProfile path="/settings/users" />
    </main>
  )
}
