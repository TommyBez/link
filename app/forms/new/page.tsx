import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { FormBuilder } from '@/components/forms/form-builder'
import { getCurrentDbUser, getCurrentOrganization } from '@/lib/auth'

export default async function NewFormPage() {
  const user = await getCurrentDbUser()
  const org = await getCurrentOrganization()

  if (!(user && org) || user.organizationId !== org.id) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader organizationName={org.name} />
      <FormBuilder />
    </div>
  )
}
