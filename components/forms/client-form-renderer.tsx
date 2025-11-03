"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SignatureCanvas } from "./signature-canvas"
import { submitForm } from "@/lib/actions/submissions"
import type { FormField } from "@/lib/types/form"

interface ClientFormRendererProps {
  formId: string
  fields: FormField[]
}

export function ClientFormRenderer({ formId, fields }: ClientFormRendererProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!clientName.trim()) {
      newErrors.clientName = "Name is required"
    }

    if (!clientEmail.trim()) {
      newErrors.clientEmail = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      newErrors.clientEmail = "Invalid email address"
    }

    fields.forEach((field) => {
      if (field.required && !["text_block", "heading", "divider"].includes(field.fieldType)) {
        if (!formData[field.id]?.trim()) {
          newErrors[field.id] = `${field.label} is required`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const submissionId = await submitForm({
        formId,
        clientName,
        clientEmail,
        answers: formData,
      })

      router.push(`/submit/${formId}/success?submissionId=${submissionId}`)
    } catch (error) {
      console.error("Failed to submit form:", error)
      alert("Failed to submit form. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8 space-y-4 border-b border-gray-200 pb-8">
        <div>
          <Label htmlFor="clientName">
            Your Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="clientName"
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value)
              if (errors.clientName) {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.clientName
                  return newErrors
                })
              }
            }}
            className="mt-1"
            placeholder="John Doe"
          />
          {errors.clientName && <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>}
        </div>

        <div>
          <Label htmlFor="clientEmail">
            Your Email <span className="text-red-600">*</span>
          </Label>
          <Input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => {
              setClientEmail(e.target.value)
              if (errors.clientEmail) {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.clientEmail
                  return newErrors
                })
              }
            }}
            className="mt-1"
            placeholder="john@example.com"
          />
          {errors.clientEmail && <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>}
        </div>
      </div>

      <div className="space-y-6">
        {fields.map((field) => {
          if (field.fieldType === "heading") {
            return (
              <h2 key={field.id} className="text-xl font-semibold text-gray-900">
                {field.label}
              </h2>
            )
          }

          if (field.fieldType === "text_block") {
            return (
              <p key={field.id} className="text-pretty leading-relaxed text-gray-700">
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
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </Label>
                <SignatureCanvas onChange={(dataUrl) => handleFieldChange(field.id, dataUrl)} />
                {errors[field.id] && <p className="text-sm text-red-600">{errors[field.id]}</p>}
              </div>
            )
          }

          if (field.fieldType === "textarea") {
            return (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </Label>
                <Textarea
                  id={field.id}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                />
                {errors[field.id] && <p className="text-sm text-red-600">{errors[field.id]}</p>}
              </div>
            )
          }

          if (field.fieldType === "checkbox") {
            return (
              <div key={field.id} className="flex items-start gap-3">
                <Checkbox
                  id={field.id}
                  checked={formData[field.id] === "true"}
                  onCheckedChange={(checked) => handleFieldChange(field.id, checked ? "true" : "false")}
                />
                <Label htmlFor={field.id} className="cursor-pointer leading-relaxed">
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </Label>
                {errors[field.id] && <p className="text-sm text-red-600">{errors[field.id]}</p>}
              </div>
            )
          }

          if (field.fieldType === "radio") {
            return (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </Label>
                <RadioGroup
                  value={formData[field.id] || ""}
                  onValueChange={(value) => handleFieldChange(field.id, value)}
                >
                  {field.options?.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                      <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors[field.id] && <p className="text-sm text-red-600">{errors[field.id]}</p>}
              </div>
            )
          }

          if (field.fieldType === "select") {
            return (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </Label>
                <Select value={formData[field.id] || ""} onValueChange={(value) => handleFieldChange(field.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "Select an option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[field.id] && <p className="text-sm text-red-600">{errors[field.id]}</p>}
              </div>
            )
          }

          // Default: text, email, phone, date
          return (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-600"> *</span>}
              </Label>
              <Input
                id={field.id}
                type={
                  field.fieldType === "email"
                    ? "email"
                    : field.fieldType === "date"
                      ? "date"
                      : field.fieldType === "phone"
                        ? "tel"
                        : "text"
                }
                value={formData[field.id] || ""}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder}
              />
              {errors[field.id] && <p className="text-sm text-red-600">{errors[field.id]}</p>}
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
          {isSubmitting ? "Submitting..." : "Submit Form"}
        </Button>
      </div>
    </form>
  )
}
