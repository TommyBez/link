'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLocalProgress } from '@/hooks/use-local-progress'
import type { TemplateDraftInput } from '@/lib/templates/schema'
import type { DynamicFormSubmitMeta } from './dynamic-form'
import { DynamicForm } from './dynamic-form'

type IntakeFormShellProps = {
  token: string
  status: 'pending' | 'completed' | 'expired'
  expiresAt: string
  templateVersionId: string
  templateTitle: string
  schema: TemplateDraftInput
  branding: TemplateDraftInput['branding'] | null
  prefill: Record<string, unknown>
}

export function IntakeFormShell({
  token,
  status,
  expiresAt,
  templateVersionId,
  templateTitle,
  schema,
  branding,
  prefill,
}: IntakeFormShellProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(status === 'completed')
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const storageKey = useMemo(
    () => `intake:${token}:${templateVersionId}`,
    [templateVersionId, token],
  )

  const initialValues = useMemo<Record<string, unknown>>(
    () => ({ ...prefill }),
    [prefill],
  )

  const { restoredValues, saveProgress, clearProgress, isHydrated } =
    useLocalProgress({
      storageKey,
      initialValues,
      schemaMeta: {
        templateVersionId,
        templateTitle,
        expiresAt,
      },
    })

  const currentValues = useMemo(
    () => restoredValues ?? initialValues,
    [initialValues, restoredValues],
  )

  const handleAutosave = useCallback(
    (values: Record<string, unknown>) => {
      if (isCompleted) {
        return
      }
      saveProgress(values)
    },
    [isCompleted, saveProgress],
  )

  const handleSubmit = useCallback(
    async (
      values: Record<string, unknown>,
      metadata: DynamicFormSubmitMeta,
    ) => {
      if (isSubmitting || isCompleted) {
        return
      }

      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            responses: values,
            signature: metadata.signature ?? null,
          }),
        })

        if (!response.ok) {
          let message = 'Impossibile inviare il modulo. Riprova.'
          try {
            const errorBody = (await response.json()) as { error?: string }
            if (errorBody?.error) {
              message = errorBody.error
            }
          } catch {
            // Use default message
          }
          throw new Error(message)
        }

        const body = (await response.json()) as { submissionId: string }
        clearProgress()
        setSubmissionId(body.submissionId)
        setIsCompleted(true)
        toast.success('Modulo inviato con successo.')
        router.refresh()
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Impossibile inviare il modulo. Riprova.'
        setSubmitError(message)
        toast.error(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [clearProgress, isCompleted, isSubmitting, router, token],
  )

  if (!isHydrated) {
    return (
      <div className="flex min-h-[120px] items-center justify-center">
        <span className="text-muted-foreground text-sm">
          Caricamento del modulo...
        </span>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Modulo inviato</AlertTitle>
          <AlertDescription>
            Grazie per aver completato {templateTitle}. Riceverai eventuali
            comunicazioni dal tuo referente.
            {submissionId ? ` ID di riferimento: ${submissionId}` : ''}
          </AlertDescription>
        </Alert>
        <Separator />
        <Button className="w-full" onClick={() => router.refresh()}>
          Aggiorna la pagina
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {submitError ? (
        <Alert variant="destructive">
          <AlertTitle>Invio non riuscito</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
      <DynamicForm
        branding={branding}
        initialValues={currentValues}
        isSubmitting={isSubmitting}
        onAutosave={handleAutosave}
        onSubmit={handleSubmit}
        schema={schema}
      />
      <p className="text-muted-foreground text-sm">
        Le modifiche vengono salvate automaticamente su questo dispositivo.
      </p>
    </div>
  )
}
