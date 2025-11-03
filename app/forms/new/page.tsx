import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { FormBuilder } from "@/components/forms/form-builder"
import { getCurrentOrganization, ensureUserInDatabase } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function NewFormPage() {
  await ensureUserInDatabase()
  const org = await getCurrentOrganization()

  if (!org) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader organizationName={org.name} />
      <FormBuilder />
    </div>
  )
}
