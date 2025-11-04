'use client'

import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { FormField } from '@/lib/types/form'

type FieldListProps = {
  fields: FormField[]
  onUpdateField: (id: string, updates: Partial<FormField>) => void
  onDeleteField: (id: string) => void
  onMoveField: (id: string, direction: 'up' | 'down') => void
}

function renderFieldEditor(
  field: FormField,
  onUpdateField: (id: string, updates: Partial<FormField>) => void,
) {
  if (field.fieldType === 'text_block') {
    return (
      <div>
        <Label>Content</Label>
        <Textarea
          className="mt-1"
          onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
          rows={3}
          value={field.label}
        />
      </div>
    )
  }

  if (field.fieldType === 'divider') {
    return <p className="text-gray-500 text-sm">Visual separator line</p>
  }

  return (
    <>
      <div>
        <Label>Label</Label>
        <Input
          className="mt-1"
          onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
          value={field.label}
        />
      </div>

      {!['heading', 'checkbox', 'signature'].includes(field.fieldType) && (
        <div>
          <Label>Placeholder</Label>
          <Input
            className="mt-1"
            onChange={(e) =>
              onUpdateField(field.id, { placeholder: e.target.value })
            }
            value={field.placeholder || ''}
          />
        </div>
      )}

      {['radio', 'select'].includes(field.fieldType) && (
        <div>
          <Label>Options (comma separated)</Label>
          <Input
            className="mt-1"
            onChange={(e) =>
              onUpdateField(field.id, {
                options: e.target.value.split(',').map((o) => o.trim()),
              })
            }
            value={field.options?.join(', ') || ''}
          />
        </div>
      )}

      {!['heading'].includes(field.fieldType) && (
        <div className="flex items-center justify-between">
          <Label>Required</Label>
          <Switch
            checked={field.required}
            onCheckedChange={(checked) =>
              onUpdateField(field.id, { required: checked })
            }
          />
        </div>
      )}
    </>
  )
}

export function FieldList({
  fields,
  onUpdateField,
  onDeleteField,
  onMoveField,
}: FieldListProps) {
  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600 text-sm">
          No fields added yet. Add fields using the buttons above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-900 text-lg">Form Fields</h2>
      {fields.map((field, index) => (
        <div
          className="rounded-lg border border-gray-200 bg-white p-4"
          key={field.id}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-700 text-sm">
                {field.fieldType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                disabled={index === 0}
                onClick={() => onMoveField(field.id, 'up')}
                size="sm"
                variant="ghost"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                disabled={index === fields.length - 1}
                onClick={() => onMoveField(field.id, 'down')}
                size="sm"
                variant="ghost"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onDeleteField(field.id)}
                size="sm"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {renderFieldEditor(field, onUpdateField)}
          </div>
        </div>
      ))}
    </div>
  )
}
