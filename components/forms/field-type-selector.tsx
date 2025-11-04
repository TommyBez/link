'use client'

import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  FileText,
  Heading,
  Mail,
  Minus,
  PenTool,
  Phone,
  Type,
} from 'lucide-react'
import type React from 'react'
import { Button } from '@/components/ui/button'
import type { FieldType, FormField } from '@/lib/types/form'

type FieldTypeSelectorProps = {
  onAddField: (field: Omit<FormField, 'id' | 'order'>) => void
}

const fieldTypes: Array<{
  type: FieldType
  label: string
  icon: React.ComponentType<{ className?: string }>
  defaultLabel: string
}> = [
  {
    type: 'heading',
    label: 'Heading',
    icon: Heading,
    defaultLabel: 'Section Title',
  },
  {
    type: 'text_block',
    label: 'Text Block',
    icon: FileText,
    defaultLabel: 'Information text...',
  },
  { type: 'divider', label: 'Divider', icon: Minus, defaultLabel: '' },
  { type: 'text', label: 'Text Input', icon: Type, defaultLabel: 'Text field' },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: AlignLeft,
    defaultLabel: 'Long text field',
  },
  { type: 'email', label: 'Email', icon: Mail, defaultLabel: 'Email address' },
  { type: 'phone', label: 'Phone', icon: Phone, defaultLabel: 'Phone number' },
  { type: 'date', label: 'Date', icon: Calendar, defaultLabel: 'Date' },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    defaultLabel: 'Checkbox option',
  },
  {
    type: 'radio',
    label: 'Radio',
    icon: Circle,
    defaultLabel: 'Radio options',
  },
  {
    type: 'select',
    label: 'Select',
    icon: ChevronDown,
    defaultLabel: 'Select option',
  },
  {
    type: 'signature',
    label: 'Signature',
    icon: PenTool,
    defaultLabel: 'Signature',
  },
]

export function FieldTypeSelector({ onAddField }: FieldTypeSelectorProps) {
  const handleAddField = (type: FieldType, defaultLabel: string) => {
    const isStaticContent = ['text_block', 'heading', 'divider'].includes(type)

    onAddField({
      fieldType: type,
      label: defaultLabel,
      placeholder: isStaticContent ? undefined : 'Enter value...',
      required: false,
      options: ['radio', 'select'].includes(type)
        ? ['Option 1', 'Option 2']
        : undefined,
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 font-semibold text-gray-900 text-lg">Add Field</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fieldTypes.map((fieldType) => {
          const Icon = fieldType.icon
          return (
            <Button
              className="h-auto flex-col gap-2 py-3"
              key={fieldType.type}
              onClick={() =>
                handleAddField(fieldType.type, fieldType.defaultLabel)
              }
              variant="outline"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{fieldType.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
