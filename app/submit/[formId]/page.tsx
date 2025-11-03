import { db } from "@/lib/db"
import { forms, formFields } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { notFound } from "next/navigation"
import { ClientFormRenderer } from "@/components/forms/client-form-renderer"

interface PageProps {
  params: Promise<{ formId: string }>
}

export default async function SubmitFormPage({ params }: PageProps) {
  const { formId } = await params

  // Fetch form
  const [form] = await db.select().from(forms).where(eq(forms.id, formId)).limit(1)

  if (!form || !form.isActive) {
    notFound()
  }

  // Fetch form fields
  const fields = await db.select().from(formFields).where(eq(formFields.formId, formId)).orderBy(asc(formFields.order))

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-2xl font-bold text-white">L</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
          {form.description && <p className="mt-2 text-gray-600">{form.description}</p>}
        </div>

        <ClientFormRenderer
          formId={form.id}
          fields={fields.map((field) => ({
            id: field.id,
            fieldType: field.fieldType as any,
            label: field.label,
            placeholder: field.placeholder || undefined,
            required: field.required,
            options: field.options as string[] | undefined,
            order: field.order,
          }))}
        />
      </div>
    </div>
  )
}
