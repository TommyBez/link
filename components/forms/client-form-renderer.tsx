'use client'

import { useRouter } from 'next/navigation'
import type React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { submitForm } from '@/lib/actions/submissions'
import type { FormField } from '@/lib/types/form'
import { SignatureCanvas } from './signature-canvas'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ClientFormRendererProps = {
  formId: string
  fields: FormField[]
}

function getInputType(fieldType: string): string {
  if (fieldType === 'email') {
    return 'email'
  }
  if (fieldType === 'date') {
    return 'date'
  }
  if (fieldType === 'phone') {
    return 'tel'
  }
  return 'text'
}

type FieldRendererProps = {
  field: FormField
  formData: Record<string, string>
  errors: Record<string, string | undefined>
  onFieldChange: (fieldId: string, value: string) => void
}

function renderHeading(field: FormField) {
  return (
    <h2 className="font-semibold text-gray-900 text-xl" key={field.id}>
      {field.label}
    </h2>
  )
}

function renderTextBlock(field: FormField) {
  return (
    <p className="text-pretty text-gray-700 leading-relaxed" key={field.id}>
      {field.label}
    </p>
  )
}

function renderDivider(field: FormField) {
  return <hr className="border-gray-300" key={field.id} />
}

function renderSignature(
  field: FormField,
  onFieldChange: (fieldId: string, value: string) => void,
  errors: Record<string, string | undefined>,
) {
  return (
    <div className="space-y-2" key={field.id}>
      <Label>
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </Label>
      <SignatureCanvas
        onChange={(dataUrl) => onFieldChange(field.id, dataUrl)}
      />
      {errors[field.id] && (
        <p className="text-red-600 text-sm">{errors[field.id]}</p>
      )}
    </div>
  )
}

function renderTextarea(
  field: FormField,
  formData: Record<string, string>,
  onFieldChange: (fieldId: string, value: string) => void,
  errors: Record<string, string | undefined>,
) {
  return (
    <div className="space-y-2" key={field.id}>
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </Label>
      <Textarea
        id={field.id}
        onChange={(e) => onFieldChange(field.id, e.target.value)}
        placeholder={field.placeholder}
        rows={4}
        value={formData[field.id] || ''}
      />
      {errors[field.id] && (
        <p className="text-red-600 text-sm">{errors[field.id]}</p>
      )}
    </div>
  )
}

function renderCheckbox(
  field: FormField,
  formData: Record<string, string>,
  onFieldChange: (fieldId: string, value: string) => void,
  errors: Record<string, string | undefined>,
) {
  return (
    <div className="flex items-start gap-3" key={field.id}>
      <Checkbox
        checked={formData[field.id] === 'true'}
        id={field.id}
        onCheckedChange={(checked) =>
          onFieldChange(field.id, checked ? 'true' : 'false')
        }
      />
      <Label className="cursor-pointer leading-relaxed" htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </Label>
      {errors[field.id] && (
        <p className="text-red-600 text-sm">{errors[field.id]}</p>
      )}
    </div>
  )
}

function renderRadio(
  field: FormField,
  formData: Record<string, string>,
  onFieldChange: (fieldId: string, value: string) => void,
  errors: Record<string, string | undefined>,
) {
  return (
    <div className="space-y-2" key={field.id}>
      <Label>
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </Label>
      <RadioGroup
        onValueChange={(value) => onFieldChange(field.id, value)}
        value={formData[field.id] || ''}
      >
        {field.options?.map((option) => (
          <div className="flex items-center gap-2" key={option}>
            <RadioGroupItem id={`${field.id}-${option}`} value={option} />
            <Label className="cursor-pointer" htmlFor={`${field.id}-${option}`}>
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {errors[field.id] && (
        <p className="text-red-600 text-sm">{errors[field.id]}</p>
      )}
    </div>
  )
}

function renderSelect(
  field: FormField,
  formData: Record<string, string>,
  onFieldChange: (fieldId: string, value: string) => void,
  errors: Record<string, string | undefined>,
) {
  return (
    <div className="space-y-2" key={field.id}>
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </Label>
      <Select
        onValueChange={(value) => onFieldChange(field.id, value)}
        value={formData[field.id] || ''}
      >
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || 'Select an option'} />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors[field.id] && (
        <p className="text-red-600 text-sm">{errors[field.id]}</p>
      )}
    </div>
  )
}

function renderTextInput(
  field: FormField,
  formData: Record<string, string>,
  onFieldChange: (fieldId: string, value: string) => void,
  errors: Record<string, string | undefined>,
) {
  return (
    <div className="space-y-2" key={field.id}>
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </Label>
      <Input
        id={field.id}
        onChange={(e) => onFieldChange(field.id, e.target.value)}
        placeholder={field.placeholder}
        type={getInputType(field.fieldType)}
        value={formData[field.id] || ''}
      />
      {errors[field.id] && (
        <p className="text-red-600 text-sm">{errors[field.id]}</p>
      )}
    </div>
  )
}

function FieldRenderer({
  field,
  formData,
  errors,
  onFieldChange,
}: FieldRendererProps) {
  switch (field.fieldType) {
    case 'heading':
      return renderHeading(field)
    case 'text_block':
      return renderTextBlock(field)
    case 'divider':
      return renderDivider(field)
    case 'signature':
      return renderSignature(field, onFieldChange, errors)
    case 'textarea':
      return renderTextarea(field, formData, onFieldChange, errors)
    case 'checkbox':
      return renderCheckbox(field, formData, onFieldChange, errors)
    case 'radio':
      return renderRadio(field, formData, onFieldChange, errors)
    case 'select':
      return renderSelect(field, formData, onFieldChange, errors)
    default:
      return renderTextInput(field, formData, onFieldChange, errors)
  }
}

export function ClientFormRenderer({
  formId,
  fields,
}: ClientFormRendererProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        newErrors[fieldId] = undefined
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!clientName.trim()) {
      newErrors.clientName = 'Name is required'
    }

    if (!clientEmail.trim()) {
      newErrors.clientEmail = 'Email is required'
    } else if (!EMAIL_REGEX.test(clientEmail)) {
      newErrors.clientEmail = 'Invalid email address'
    }

    for (const field of fields) {
      if (
        field.required &&
        !['text_block', 'heading', 'divider'].includes(field.fieldType) &&
        !formData[field.id]?.trim()
      ) {
        newErrors[field.id] = `${field.label} is required`
      }
    }

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
    } catch (_error) {
      toast.error('Failed to submit form. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="mb-8 space-y-4 border-gray-200 border-b pb-8">
        <div>
          <Label htmlFor="clientName">
            Your Name <span className="text-red-600">*</span>
          </Label>
          <Input
            className="mt-1"
            id="clientName"
            onChange={(e) => {
              setClientName(e.target.value)
              if (errors.clientName) {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  newErrors.clientName = undefined
                  return newErrors
                })
              }
            }}
            placeholder="John Doe"
            value={clientName}
          />
          {errors.clientName && (
            <p className="mt-1 text-red-600 text-sm">{errors.clientName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="clientEmail">
            Your Email <span className="text-red-600">*</span>
          </Label>
          <Input
            className="mt-1"
            id="clientEmail"
            onChange={(e) => {
              setClientEmail(e.target.value)
              if (errors.clientEmail) {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  newErrors.clientEmail = undefined
                  return newErrors
                })
              }
            }}
            placeholder="john@example.com"
            type="email"
            value={clientEmail}
          />
          {errors.clientEmail && (
            <p className="mt-1 text-red-600 text-sm">{errors.clientEmail}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {fields.map((field) => (
          <FieldRenderer
            errors={errors}
            field={field}
            formData={formData}
            key={field.id}
            onFieldChange={handleFieldChange}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          className="w-full sm:w-auto"
          disabled={isSubmitting}
          size="lg"
          type="submit"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Form'}
        </Button>
      </div>
    </form>
  )
}
