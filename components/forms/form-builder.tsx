'use client'

import { ArrowLeft, Eye, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createForm } from '@/lib/actions/forms'
import type { FormData, FormField } from '@/lib/types/form'
import { FieldList } from './field-list'
import { FieldTypeSelector } from './field-type-selector'
import { PDFPreview } from './pdf-preview'

export function FormBuilder() {
  const _router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    isActive: true,
    fields: [],
  })
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const addField = (field: Omit<FormField, 'id' | 'order'>) => {
    const newField: FormField = {
      ...field,
      id: crypto.randomUUID(),
      order: formData.fields.length,
    }
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    }))
  }

  const deleteField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== id),
    }))
  }

  const moveField = (id: string, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const fields = [...prev.fields]
      const index = fields.findIndex((f) => f.id === id)
      if (index === -1) {
        return prev
      }

      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= fields.length) {
        return prev
      }
      ;[fields[index], fields[newIndex]] = [fields[newIndex], fields[index]]

      // Update order values
      return {
        ...prev,
        fields: fields.map((field, idx) => ({ ...field, order: idx })),
      }
    })
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a form title')
      return
    }

    setIsSaving(true)
    try {
      await createForm(formData)
    } catch (_error) {
      toast.error('Failed to save form. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-900"
          href="/forms"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forms
        </Link>
        <div className="flex gap-3">
          <Button
            className="gap-2"
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button className="gap-2" disabled={isSaving} onClick={handleSave}>
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-900 text-lg">
              Form Settings
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  className="mt-1"
                  id="title"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Medical Consent Form"
                  value={formData.title}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  className="mt-1"
                  id="description"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of this form"
                  rows={3}
                  value={formData.description}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  checked={formData.isActive}
                  id="active"
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <FieldTypeSelector onAddField={addField} />

          <FieldList
            fields={formData.fields}
            onDeleteField={deleteField}
            onMoveField={moveField}
            onUpdateField={updateField}
          />
        </div>

        {showPreview && (
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <PDFPreview formData={formData} />
          </div>
        )}
      </div>
    </div>
  )
}
