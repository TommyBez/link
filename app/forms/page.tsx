import { redirect } from "next/navigation"
import { getCurrentOrganization, ensureUserInDatabase } from "@/lib/auth"
import { db } from "@/lib/db"
import { forms, formSubmissions } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { FormsList } from "@/components/forms/forms-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function FormsPage() {
  await ensureUserInDatabase()
  const org = await getCurrentOrganization()

  if (!org) {
    redirect("/sign-in")
  }

  // Fetch forms with submission counts
  const formsList = await db
    .select({
      id: forms.id,
      title: forms.title,
      description: forms.description,
      isActive: forms.isActive,
      updatedAt: forms.updatedAt,
      submissionCount: sql<number>`count(${formSubmissions.id})`,
    })
    .from(forms)
    .leftJoin(formSubmissions, eq(forms.id, formSubmissions.formId))
    .where(eq(forms.organizationId, org.id))
    .groupBy(forms.id)
    .orderBy(desc(forms.updatedAt))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader organizationName={org.name} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
          <Button asChild className="gap-2">
            <Link href="/forms/new">
              <Plus className="h-4 w-4" />
              Create New Form
            </Link>
          </Button>
        </div>

        <FormsList forms={formsList} />
      </main>
    </div>
  )
}
