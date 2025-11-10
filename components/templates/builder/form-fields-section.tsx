'use client'

import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FieldInput } from '@/lib/templates/schema'
import { INITIAL_CATALOG } from './constants'
import { SortableFieldEditor } from './sortable-field-editor'
import type { FieldCatalogItem } from './types'

type FormFieldsSectionProps = {
  addField: (catalogItem: FieldCatalogItem) => void
  fields: FieldInput[]
  handleDragEnd: (event: DragEndEvent) => void
  removeField: (id: string) => void
  sensors: ReturnType<typeof import('@dnd-kit/core').useSensors>
  updateField: (field: FieldInput) => void
}

function EmptyState({ addField }: { addField: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/40 py-12 text-center">
      <div className="space-y-1">
        <p className="font-medium text-lg">No fields yet</p>
        <p className="text-muted-foreground text-sm">
          Start by adding a field type from the builder palette.
        </p>
      </div>
      <Button onClick={addField} type="button">
        <PlusIcon className="mr-2 size-4" />
        Add first field
      </Button>
    </div>
  )
}

export function FormFieldsSection({
  addField,
  fields,
  handleDragEnd,
  removeField,
  sensors,
  updateField,
}: FormFieldsSectionProps) {
  return (
    <Card>
      <CardHeader className="overflow-hidden">
        <CardTitle>Form fields</CardTitle>
        <CardDescription>
          Drag to reorder fields. Configure labels, requirements, and helper
          text.
        </CardDescription>
        <CardAction className="w-fit min-w-0 max-w-full">
          <div className="flex flex-wrap items-center gap-2">
            {INITIAL_CATALOG.map((item) => (
              <Button
                className="hidden sm:inline-flex"
                key={item.type}
                onClick={() => addField(item)}
                size="sm"
                type="button"
                variant="outline"
              >
                <PlusIcon className="mr-2 size-4" />
                {item.label}
              </Button>
            ))}
            <Select
              onValueChange={(type) => {
                const catalogItem = INITIAL_CATALOG.find(
                  (item) => item.type === type,
                )
                if (catalogItem) {
                  addField(catalogItem)
                }
              }}
            >
              <SelectTrigger className="w-[180px] sm:hidden">
                <SelectValue placeholder="Add field" />
              </SelectTrigger>
              <SelectContent>
                {INITIAL_CATALOG.map((item) => (
                  <SelectItem key={item.type} value={item.type}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <EmptyState addField={() => addField(INITIAL_CATALOG[0])} />
        ) : (
          <DndContext
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {fields.map((field) => (
                  <SortableFieldEditor
                    field={field}
                    key={field.id}
                    removeField={removeField}
                    updateField={updateField}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  )
}
