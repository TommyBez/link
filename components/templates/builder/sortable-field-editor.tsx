'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVerticalIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { FieldInput } from '@/lib/templates/schema'
import { cn } from '@/lib/utils'

type FieldControlsProps = {
  field: FieldInput
  updateField: (field: FieldInput) => void
}

function FieldCommonControls({ field, updateField }: FieldControlsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${field.id}-label`}>Etichetta</Label>
        <Input
          id={`${field.id}-label`}
          onChange={(event) =>
            updateField({ ...field, label: event.target.value })
          }
          value={field.label}
        />
      </div>
      {field.type !== 'content' ? (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-helper`}>Testo di aiuto</Label>
          <Textarea
            id={`${field.id}-helper`}
            onChange={(event) =>
              updateField({ ...field, helperText: event.target.value })
            }
            rows={2}
            value={field.helperText ?? ''}
          />
        </div>
      ) : null}
      {(field.type === 'text' ||
        field.type === 'textarea' ||
        field.type === 'email' ||
        field.type === 'phone') && (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-placeholder`}>Testo segnaposto</Label>
          <Input
            id={`${field.id}-placeholder`}
            onChange={(event) =>
              updateField({
                ...field,
                placeholder: event.target.value,
              })
            }
            value={field.placeholder ?? ''}
          />
        </div>
      )}
    </div>
  )
}

function TypeSpecificControls({ field, updateField }: FieldControlsProps) {
  switch (field.type) {
    case 'text':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-maxlength`}>Lunghezza massima</Label>
            <Input
              id={`${field.id}-maxlength`}
              min={1}
              onChange={(event) =>
                updateField({
                  ...field,
                  maxLength: event.target.value
                    ? Number.parseInt(event.target.value, 10)
                    : undefined,
                })
              }
              placeholder="Opzionale"
              type="number"
              value={field.maxLength ?? ''}
            />
          </div>
        </div>
      )
    case 'textarea':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-maxlength`}>Lunghezza massima</Label>
            <Input
              id={`${field.id}-maxlength`}
              min={1}
              onChange={(event) =>
                updateField({
                  ...field,
                  maxLength: event.target.value
                    ? Number.parseInt(event.target.value, 10)
                    : undefined,
                })
              }
              placeholder="Opzionale"
              type="number"
              value={field.maxLength ?? ''}
            />
          </div>
        </div>
      )
    case 'phone':
      return (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-pattern`}>Pattern di validazione</Label>
          <Input
            id={`${field.id}-pattern`}
            onChange={(event) =>
              updateField({ ...field, pattern: event.target.value })
            }
            placeholder="Es. ^\\+?[0-9()\\s-]+$"
            value={field.pattern ?? ''}
          />
        </div>
      )
    case 'date':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-min`}>Data più antica</Label>
            <Input
              id={`${field.id}-min`}
              onChange={(event) =>
                updateField({ ...field, min: event.target.value })
              }
              type="date"
              value={field.min ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-max`}>Data più recente</Label>
            <Input
              id={`${field.id}-max`}
              onChange={(event) =>
                updateField({ ...field, max: event.target.value })
              }
              type="date"
              value={field.max ?? ''}
            />
          </div>
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={field.defaultValue ?? false}
            id={`${field.id}-default`}
            onCheckedChange={(checked) =>
              updateField({
                ...field,
                defaultValue: checked,
              })
            }
          />
          <Label
            className="text-muted-foreground text-sm"
            htmlFor={`${field.id}-default`}
          >
            Selezionato di default
          </Label>
        </div>
      )
    case 'radio':
      return <RadioOptionsEditor field={field} updateField={updateField} />
    case 'signature':
      return (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-ack`}>Testo di riconoscimento</Label>
          <Textarea
            id={`${field.id}-ack`}
            onChange={(event) =>
              updateField({ ...field, acknowledgementText: event.target.value })
            }
            rows={3}
            value={field.acknowledgementText ?? ''}
          />
        </div>
      )
    case 'content':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-content`}>Contenuto</Label>
            <Textarea
              id={`${field.id}-content`}
              onChange={(event) =>
                updateField({ ...field, content: event.target.value })
              }
              rows={4}
              value={field.content}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-align`}>Allineamento</Label>
            <Select
              onValueChange={(value) =>
                updateField({
                  ...field,
                  align: value as 'start' | 'center' | 'end',
                })
              }
              value={field.align ?? 'start'}
            >
              <SelectTrigger className="w-40" id={`${field.id}-align`}>
                <SelectValue placeholder="Seleziona allineamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Sinistra</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="end">Destra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    default:
      return null
  }
}

function RadioOptionsEditor({
  field,
  updateField,
}: {
  field: Extract<FieldInput, { type: 'radio' }>
  updateField: (field: FieldInput) => void
}) {
  const addOption = () => {
    updateField({
      ...field,
      options: [
        ...field.options,
        {
          id: crypto.randomUUID(),
          label: `Opzione ${String.fromCharCode(65 + field.options.length)}`,
        },
      ],
    })
  }

  const updateOptionLabel = (index: number, value: string) => {
    const options = field.options.map((option, idx) =>
      idx === index ? { ...option, label: value } : option,
    )
    updateField({ ...field, options })
  }

  const removeOption = (index: number) => {
    if (field.options.length <= 2) {
      toast.error('I campi radio richiedono almeno due opzioni.')
      return
    }
    const options = field.options.filter((_, idx) => idx !== index)
    updateField({ ...field, options })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Opzioni</Label>
        <div className="space-y-2">
          {field.options.map((option, index) => (
            <div className="flex items-center gap-2" key={option.id}>
              <Input
                onChange={(event) =>
                  updateOptionLabel(index, event.target.value)
                }
                placeholder={`Opzione ${index + 1}`}
                value={option.label}
              />
              <Button
                disabled={field.options.length <= 2}
                onClick={() => removeOption(index)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={addOption} size="sm" type="button" variant="outline">
        <PlusIcon className="mr-2 size-4" />
        Aggiungi opzione
      </Button>
    </div>
  )
}

type SortableFieldEditorProps = {
  field: FieldInput
  updateField: (field: FieldInput) => void
  removeField: (id: string) => void
}

export function SortableFieldEditor({
  field,
  updateField,
  removeField,
}: SortableFieldEditorProps) {
  const sortable = useSortable({ id: field.id })
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable
  const supportsRequired = field.type !== 'content'

  return (
    <Card
      className={cn(
        'border-dashed p-0 shadow-sm transition',
        isDragging && 'border-primary bg-primary/5',
      )}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/50 py-3">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center text-muted-foreground hover:text-primary"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="size-5" />
          </button>
          <div>
            <p className="font-medium">{field.label || 'Campo senza titolo'}</p>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {field.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {supportsRequired ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                id={`${field.id}-required`}
                onCheckedChange={(checked) =>
                  updateField({ ...field, required: checked })
                }
              />
              <Label
                className="font-medium text-muted-foreground text-xs"
                htmlFor={`${field.id}-required`}
              >
                Obbligatorio
              </Label>
            </div>
          ) : (
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Contenuto statico
            </span>
          )}
          <Button
            className="text-muted-foreground hover:text-destructive"
            onClick={() => removeField(field.id)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 py-4">
        <FieldCommonControls field={field} updateField={updateField} />
        <TypeSpecificControls field={field} updateField={updateField} />
      </CardContent>
    </Card>
  )
}
