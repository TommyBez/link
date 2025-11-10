'use client'

import {
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { DEFAULT_BRANDING } from '@/components/templates/builder/constants'
import { FormFieldsSection } from '@/components/templates/builder/form-fields-section'
import { TemplateDetailsForm } from '@/components/templates/builder/template-details-form'
import { TemplateStatusSidebar } from '@/components/templates/builder/template-status-sidebar'
import type {
  BrandingState,
  FieldCatalogItem,
  PaletteOption,
  TemplateMeta,
} from '@/components/templates/builder/types'
import {
  type FieldInput,
  type TemplateDraftInput,
  templateDraft,
} from '@/lib/templates/schema'

export default function NewTemplateBuilderPage() {
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [locale, setLocale] = useState('it-IT')
  const [fields, setFields] = useState<FieldInput[]>([])
  const [branding, setBranding] = useState<BrandingState>(() => ({
    ...DEFAULT_BRANDING,
  }))
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const updateBranding = useCallback((patch: Partial<BrandingState>) => {
    setBranding((previous) => ({ ...previous, ...patch }))
  }, [])

  const applyPalette = useCallback((palette: PaletteOption) => {
    setBranding((previous) => ({
      ...previous,
      primaryColor: palette.primary,
      accentColor: palette.accent,
    }))
  }, [])

  const addField = useCallback((catalogItem: FieldCatalogItem) => {
    setFields((prev) => [...prev, catalogItem.create()])
  }, [])

  const updateField = useCallback((updated: FieldInput) => {
    setFields((prev) =>
      prev.map((field) => (field.id === updated.id ? updated : field)),
    )
  }, [])

  const removeField = useCallback((id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id))
  }, [])

  const brandingPayload = useMemo<TemplateDraftInput['branding']>(() => {
    const trimmedLogo = branding.logoUrl.trim()
    const trimmedPrimary = branding.primaryColor.trim()
    const trimmedAccent = branding.accentColor.trim()

    const payload: NonNullable<TemplateDraftInput['branding']> = {}

    if (trimmedLogo.length > 0) {
      payload.logoUrl = trimmedLogo
    }

    if (trimmedPrimary.length > 0) {
      payload.primaryColor = trimmedPrimary
    }

    if (trimmedAccent.length > 0) {
      payload.accentColor = trimmedAccent
    }

    return Object.keys(payload).length > 0 ? payload : undefined
  }, [branding])

  const draftPayload = useMemo<TemplateDraftInput>(
    () => ({
      name: templateName,
      description: description.trim() === '' ? undefined : description.trim(),
      locale,
      branding: brandingPayload,
      fields,
    }),
    [templateName, description, locale, fields, brandingPayload],
  )

  const validation = useMemo(
    () => templateDraft.safeParse(draftPayload),
    [draftPayload],
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    setFields((prev) => {
      const oldIndex = prev.findIndex((field) => field.id === active.id)
      const newIndex = prev.findIndex((field) => field.id === over.id)
      if (oldIndex === -1 || newIndex === -1) {
        return prev
      }
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const hasErrors = !validation.success
  const fieldErrorCount = hasErrors
    ? validation.error.issues.filter((issue) => issue.path.includes('fields'))
        .length
    : 0

  const handleSaveDraft = useCallback(() => {
    const parsed = templateDraft.safeParse(draftPayload)
    if (!parsed.success) {
      toast.error('Please resolve validation errors before saving.')
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: parsed.data,
            templateId: templateMeta?.id,
          }),
        })

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const body = (await response.json()) as {
          id: string
          status: 'draft' | 'published'
          version?: number
        }

        setTemplateMeta({
          id: body.id,
          version: body.version,
        })

        toast.success('Template draft saved.')
      } catch (error) {
        console.error(error)
        toast.error('Failed to save draft. Please try again.')
      }
    })
  }, [draftPayload, templateMeta?.id])

  const handlePublish = useCallback(() => {
    if (!templateMeta?.id) {
      toast.info('Save your draft first before publishing.')
      return
    }

    const parsed = templateDraft.safeParse(draftPayload)
    if (!parsed.success) {
      toast.error('Resolve validation errors before publishing.')
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/templates/publish/${templateMeta.id}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template: parsed.data }),
          },
        )

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const body = (await response.json()) as {
          version: number
          publishedAt: string
        }

        setTemplateMeta((prev) =>
          prev
            ? {
                ...prev,
                version: body.version,
              }
            : { id: templateMeta.id, version: body.version },
        )

        toast.success(`Template published (v${body.version}).`)
      } catch (error) {
        console.error(error)
        toast.error('Failed to publish template. Please try again.')
      }
    })
  }, [draftPayload, templateMeta])

  const handleReset = useCallback(() => {
    setTemplateMeta(null)
    setTemplateName('')
    setDescription('')
    setLocale('it-IT')
    setFields([])
    setBranding({ ...DEFAULT_BRANDING })
    toast.info('Builder reset. Start fresh!')
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 pb-16">
      <div className="mb-10 space-y-3">
        <div>
          <h1 className="font-semibold text-3xl">New consent template</h1>
          <p className="text-muted-foreground">
            Compose fields, collect signatures, and publish a reusable template
            for intakes.
          </p>
        </div>

        {templateMeta?.version ? (
          <div className="text-muted-foreground text-sm">
            Latest published version: v{templateMeta.version}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_minmax(320px,1fr)]">
        <section className="space-y-6">
          <TemplateDetailsForm
            branding={branding}
            description={description}
            locale={locale}
            onBrandingChange={updateBranding}
            onDescriptionChange={setDescription}
            onLocaleChange={setLocale}
            onPaletteApply={applyPalette}
            onTemplateNameChange={setTemplateName}
            templateName={templateName}
          />
          <FormFieldsSection
            addField={addField}
            fields={fields}
            handleDragEnd={handleDragEnd}
            removeField={removeField}
            sensors={sensors}
            updateField={updateField}
          />
        </section>

        <TemplateStatusSidebar
          draftPayload={draftPayload}
          fieldErrorCount={fieldErrorCount}
          fields={fields}
          hasErrors={hasErrors}
          isPending={isPending}
          locale={locale}
          onPublish={handlePublish}
          onReset={handleReset}
          onSaveDraft={handleSaveDraft}
          templateMeta={templateMeta}
          templateName={templateName}
          validation={validation}
        />
      </div>
    </main>
  )
}
