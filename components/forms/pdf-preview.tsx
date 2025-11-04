'use client'

import { useMemo } from 'react'
import type { FormData } from '@/lib/types/form'

type PDFPreviewProps = {
  formData: FormData
}

export function PDFPreview({ formData }: PDFPreviewProps) {
  const previewContent = useMemo(
    () => (
      <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-8 shadow-sm">
        <div className="border-gray-200 border-b pb-4">
          <h1 className="font-bold text-2xl text-gray-900">
            {formData.title || 'Untitled Form'}
          </h1>
          {formData.description && (
            <p className="mt-2 text-gray-600 text-sm">{formData.description}</p>
          )}
        </div>

        <div className="space-y-6">
          {formData.fields.map((field) => {
            if (field.fieldType === 'heading') {
              return (
                <h2
                  className="font-semibold text-gray-900 text-xl"
                  key={field.id}
                >
                  {field.label}
                </h2>
              )
            }

            if (field.fieldType === 'text_block') {
              return (
                <p
                  className="text-gray-700 text-sm leading-relaxed"
                  key={field.id}
                >
                  {field.label}
                </p>
              )
            }

            if (field.fieldType === 'divider') {
              return <hr className="border-gray-300" key={field.id} />
            }

            if (field.fieldType === 'signature') {
              return (
                <div className="space-y-2" key={field.id}>
                  <label
                    className="font-medium text-gray-900 text-sm"
                    htmlFor={`preview-${field.id}`}
                  >
                    {field.label}
                    {field.required && <span className="text-red-600"> *</span>}
                  </label>
                  <div
                    className="h-24 rounded border-2 border-gray-300 border-dashed bg-gray-50"
                    id={`preview-${field.id}`}
                  />
                </div>
              )
            }

            return (
              <div className="space-y-2" key={field.id}>
                <label
                  className="font-medium text-gray-900 text-sm"
                  htmlFor={`preview-${field.id}`}
                >
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </label>
                <div
                  className="h-10 rounded border border-gray-300 bg-gray-50"
                  id={`preview-${field.id}`}
                />
              </div>
            )
          })}
        </div>
      </div>
    ),
    [formData],
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 font-semibold text-gray-900 text-lg">Form Preview</h2>
      <div
        className="overflow-auto"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {previewContent}
      </div>
    </div>
  )
}
