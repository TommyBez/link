"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { FormField } from "@/lib/types/form"
import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react"

interface FieldListProps {
  fields: FormField[]
  onUpdateField: (id: string, updates: Partial<FormField>) => void
  onDeleteField: (id: string) => void
  onMoveField: (id: string, direction: "up" | "down") => void
}

export function FieldList({ fields, onUpdateField, onDeleteField, onMoveField }: FieldListProps) {
  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-600">No fields added yet. Add fields using the buttons above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Form Fields</h2>
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {field.fieldType.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onMoveField(field.id, "up")} disabled={index === 0}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveField(field.id, "down")}
                disabled={index === fields.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDeleteField(field.id)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {field.fieldType === "text_block" ? (
              <div>
                <Label>Content</Label>
                <Textarea
                  value={field.label}
                  onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>
            ) : field.fieldType === "divider" ? (
              <p className="text-sm text-gray-500">Visual separator line</p>
            ) : (
              <>
                <div>
                  <Label>Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
                    className="mt-1"
                  />
                </div>

                {!["heading", "checkbox", "signature"].includes(field.fieldType) && (
                  <div>
                    <Label>Placeholder</Label>
                    <Input
                      value={field.placeholder || ""}
                      onChange={(e) => onUpdateField(field.id, { placeholder: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}

                {["radio", "select"].includes(field.fieldType) && (
                  <div>
                    <Label>Options (comma separated)</Label>
                    <Input
                      value={field.options?.join(", ") || ""}
                      onChange={(e) =>
                        onUpdateField(field.id, {
                          options: e.target.value.split(",").map((o) => o.trim()),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                )}

                {!["heading"].includes(field.fieldType) && (
                  <div className="flex items-center justify-between">
                    <Label>Required</Label>
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => onUpdateField(field.id, { required: checked })}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
