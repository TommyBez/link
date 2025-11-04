import { eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { SubmissionDetail } from '@/components/submissions/submission-detail'
import { ensureUserInDatabase, getCurrentOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  formFields,
  formSubmissions,
  forms,
  submissionAnswers,
} from '@/lib/db/schema'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  await ensureUserInDatabase()
  const org = await getCurrentOrganization()

  if (!org) {
    redirect('/sign-in')
  }

  const { id } = await params

  // Fetch submission
  const [submission] = await db
    .select({
      id: formSubmissions.id,
      clientName: formSubmissions.clientName,
      clientEmail: formSubmissions.clientEmail,
      submittedAt: formSubmissions.submittedAt,
      pdfUrl: formSubmissions.pdfUrl,
      formTitle: forms.title,
      formId: forms.id,
    })
    .from(formSubmissions)
    .leftJoin(forms, eq(formSubmissions.formId, forms.id))
    .where(eq(formSubmissions.id, id))
    .limit(1)

  if (!submission) {
    notFound()
  }

  // Fetch answers with field info
  const answers = await db
    .select({
      fieldId: formFields.id,
      fieldType: formFields.fieldType,
      label: formFields.label,
      answer: submissionAnswers.answerValue,
    })
    .from(submissionAnswers)
    .leftJoin(formFields, eq(submissionAnswers.formFieldId, formFields.id))
    .where(eq(submissionAnswers.submissionId, id))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader organizationName={org.name} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SubmissionDetail answers={answers} submission={submission} />
      </main>
    </div>
  )
}
