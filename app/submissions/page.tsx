import { desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { SubmissionsList } from '@/components/submissions/submissions-list'
import { getCurrentDbUser, getCurrentOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { formSubmissions, forms } from '@/lib/db/schema'

export default async function SubmissionsPage() {
  const user = await getCurrentDbUser()
  const org = await getCurrentOrganization()

  if (!(user && org) || user.organizationId !== org.id) {
    redirect('/sign-in')
  }

  const submissions = await db
    .select({
      id: formSubmissions.id,
      clientName: formSubmissions.clientName,
      clientEmail: formSubmissions.clientEmail,
      submittedAt: formSubmissions.submittedAt,
      formTitle: forms.title,
      pdfUrl: formSubmissions.pdfUrl,
    })
    .from(formSubmissions)
    .leftJoin(forms, eq(formSubmissions.formId, forms.id))
    .where(eq(formSubmissions.organizationId, org.id))
    .orderBy(desc(formSubmissions.submittedAt))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader organizationName={org.name} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-bold text-3xl text-gray-900">All Submissions</h1>
        </div>

        <SubmissionsList submissions={submissions} />
      </main>
    </div>
  )
}
