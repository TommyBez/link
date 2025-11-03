import { redirect } from "next/navigation"
import { getCurrentOrganization, ensureUserInDatabase } from "@/lib/auth"
import { db } from "@/lib/db"
import { forms, formSubmissions } from "@/lib/db/schema"
import { eq, desc, count, sql } from "drizzle-orm"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentSubmissions } from "@/components/dashboard/recent-submissions"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function DashboardPage() {
  // Ensure user is in database
  await ensureUserInDatabase()

  const org = await getCurrentOrganization()
  if (!org) {
    redirect("/sign-in")
  }

  // Fetch dashboard statistics
  const [formsCount] = await db.select({ count: count() }).from(forms).where(eq(forms.organizationId, org.id))

  const [submissionsCount] = await db
    .select({ count: count() })
    .from(formSubmissions)
    .where(eq(formSubmissions.organizationId, org.id))

  // Get unique clients count
  const [clientsCount] = await db
    .select({ count: sql<number>`count(distinct ${formSubmissions.clientEmail})` })
    .from(formSubmissions)
    .where(eq(formSubmissions.organizationId, org.id))

  // Fetch recent submissions
  const recentSubmissions = await db
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
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader organizationName={org.name} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <DashboardStats
          formsCount={formsCount.count}
          submissionsCount={submissionsCount.count}
          clientsCount={Number(clientsCount.count)}
        />

        <div className="mt-8">
          <RecentSubmissions submissions={recentSubmissions} />
        </div>

        <div className="mt-8">
          <QuickActions />
        </div>
      </main>
    </div>
  )
}
