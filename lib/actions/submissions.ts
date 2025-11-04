'use server'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import {
  documents,
  formFields,
  formSubmissions,
  forms,
  submissionAnswers,
} from '@/lib/db/schema'
import { generateAndUploadPDF } from '@/lib/pdf/generate-pdf'

type SubmissionData = {
  formId: string
  clientName: string
  clientEmail: string
  answers: Record<string, string>
}

export async function submitForm(data: SubmissionData) {
  // Get form to verify it exists and is active
  const [form] = await db
    .select()
    .from(forms)
    .where(eq(forms.id, data.formId))
    .limit(1)

  if (!form?.isActive) {
    throw new Error('Form not found or inactive')
  }

  // Get client IP address
  const headersList = await headers()
  const ipAddress =
    headersList.get('x-forwarded-for') ||
    headersList.get('x-real-ip') ||
    'unknown'

  // Create submission
  const [submission] = await db
    .insert(formSubmissions)
    .values({
      formId: data.formId,
      organizationId: form.organizationId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      status: 'completed',
      ipAddress,
    })
    .returning()

  // Get form fields to validate answers
  const fields = await db
    .select()
    .from(formFields)
    .where(eq(formFields.formId, data.formId))

  // Create submission answers
  const answerValues = fields
    .filter(
      (field) =>
        !['text_block', 'heading', 'divider'].includes(field.fieldType),
    )
    .map((field) => ({
      submissionId: submission.id,
      formFieldId: field.id,
      answerValue: data.answers[field.id] || '',
    }))

  if (answerValues.length > 0) {
    await db.insert(submissionAnswers).values(answerValues)
  }

  // Generate PDF
  try {
    const pdfData = {
      formTitle: form.title,
      formDescription: form.description || undefined,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      submittedAt: submission.submittedAt,
      fields: fields.map((field) => ({
        id: field.id,
        fieldType: field.fieldType,
        label: field.label,
        required: field.required,
        answer: data.answers[field.id],
      })),
    }

    const pdfUrl = await generateAndUploadPDF(pdfData)

    // Update submission with PDF URL
    await db
      .update(formSubmissions)
      .set({ pdfUrl })
      .where(eq(formSubmissions.id, submission.id))

    // Create document record
    await db.insert(documents).values({
      submissionId: submission.id,
      organizationId: form.organizationId,
      fileUrl: pdfUrl,
    })
  } catch (_error) {
    // Continue even if PDF generation fails
  }

  return submission.id
}
