"use client"

import { useMemo } from "react"
import type { FormData } from "@/lib/types/form"

interface PDFPreviewProps {
  formData: FormData
}

export function PDFPreview({ formData }: PDFPreviewProps) {
  const previewContent = useMemo(() => {
    return (
      <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-8 shadow-sm">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{formData.title || "Untitled Form"}</h1>
          {formData.description && <p className="mt-2 text-sm text-gray-600">{formData.description}</p>}
        </div>

        <div className="space-y-6">
          {formData.fields.map((field) => {
            if (field.fieldType === "heading") {
              return (
                <h2 key={field.id} className="text-xl font-semibold text-gray-900">
                  {field.label}
                </h2>
              )
            }

            if (field.fieldType === "text_block") {
              return (
                <p key={field.id} className="text-sm leading-relaxed text-gray-700">
                  {field.label}
                </p>
              )
            }

            if (field.fieldType === "divider") {
              return <hr key={field.id} className="border-gray-300" />
            }

            if (field.fieldType === "signature") {
              return (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    {field.label}
                    {field.required && <span className="text-red-600"> *</span>}
                  </label>
                  <div className="h-24 rounded border-2 border-dashed border-gray-300 bg-gray-50" />
                </div>
              )
            }

            return (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </label>
                <div className="h-10 rounded border border-gray-300 bg-gray-50" />
              </div>
            )
          })}
        </div>
      </div>
    )
  }, [formData])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Form Preview</h2>
      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
        {previewContent}
      </div>
    </div>
  )
}
