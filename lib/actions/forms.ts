'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ensureUserInDatabase, getCurrentOrganization } from '@/lib/auth'
import { db } from '@/lib/db'
import { formFields, forms } from '@/lib/db/schema'
import type { FormData } from '@/lib/types/form'

export async function createForm(formData: FormData) {
  const user = await ensureUserInDatabase()
  const org = await getCurrentOrganization()

  if (!org) {
    throw new Error('No organization found')
  }

  // Create form
  const [newForm] = await db
    .insert(forms)
    .values({
      organizationId: org.id,
      createdByUserId: user.id,
      title: formData.title,
      description: formData.description,
      isActive: formData.isActive,
    })
    .returning()

  // Create form fields
  if (formData.fields.length > 0) {
    await db.insert(formFields).values(
      formData.fields.map((field) => ({
        formId: newForm.id,
        fieldType: field.fieldType,
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
        options: field.options,
        order: field.order,
        validationRules: field.validationRules,
      })),
    )
  }

  revalidatePath('/forms')
  redirect('/forms')
}

export async function updateForm(formId: string, formData: FormData) {
  const org = await getCurrentOrganization()

  if (!org) {
    throw new Error('No organization found')
  }

  // Update form
  await db
    .update(forms)
    .set({
      title: formData.title,
      description: formData.description,
      isActive: formData.isActive,
      updatedAt: new Date(),
    })
    .where(eq(forms.id, formId))

  // Delete existing fields
  await db.delete(formFields).where(eq(formFields.formId, formId))

  // Create new fields
  if (formData.fields.length > 0) {
    await db.insert(formFields).values(
      formData.fields.map((field) => ({
        formId,
        fieldType: field.fieldType,
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
        options: field.options,
        order: field.order,
        validationRules: field.validationRules,
      })),
    )
  }

  revalidatePath('/forms')
  revalidatePath(`/forms/${formId}/edit`)
  redirect('/forms')
}

export async function deleteForm(formId: string) {
  const org = await getCurrentOrganization()

  if (!org) {
    throw new Error('No organization found')
  }

  await db.delete(forms).where(eq(forms.id, formId))

  revalidatePath('/forms')
}
