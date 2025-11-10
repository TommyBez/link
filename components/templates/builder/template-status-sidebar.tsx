'use client'

import {
  ArchiveRestoreIcon,
  CheckCircle2Icon,
  Loader2Icon,
  SaveIcon,
  SparklesIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  FieldInput,
  TemplateDraftInput,
  templateDraft,
} from '@/lib/templates/schema'
import type { TemplateMeta } from './types'

export type TemplateStatusSidebarProps = {
  draftPayload: TemplateDraftInput
  fieldErrorCount: number
  fields: FieldInput[]
  hasErrors: boolean
  isPending: boolean
  locale: string
  onPublish: () => void
  onReset: () => void
  onSaveDraft: () => void
  templateMeta: TemplateMeta | null
  templateName: string
  validation: ReturnType<typeof templateDraft.safeParse>
}

export function TemplateStatusSidebar({
  draftPayload,
  fieldErrorCount,
  fields,
  hasErrors,
  isPending,
  locale,
  onPublish,
  onReset,
  onSaveDraft,
  templateMeta,
  templateName,
  validation,
}: TemplateStatusSidebarProps) {
  return (
    <aside className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status & actions</CardTitle>
          <CardDescription>
            Save drafts while iterating. Publish when you&apos;re ready to use
            this template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm leading-relaxed">
            <p className="font-medium text-muted-foreground">Validation</p>
            {validation.success ? (
              <p className="mt-2 flex items-center gap-2 text-emerald-600">
                <CheckCircle2Icon className="size-4" />
                Looks good! Ready to save or publish.
              </p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-600">
                {validation.error.issues.slice(0, 4).map((issue, index) => (
                  <li key={`${issue.path.join('.')}-${index}`}>
                    {issue.message}
                  </li>
                ))}
                {validation.error.issues.length > 4 ? (
                  <li>+{validation.error.issues.length - 4} more</li>
                ) : null}
              </ul>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-muted-foreground">Template info</p>
            <div className="grid gap-1 rounded-lg border bg-muted/50 px-4 py-3 text-muted-foreground">
              <span>Name: {templateName || '—'}</span>
              <span>Fields: {fields.length}</span>
              <span>Locale: {locale}</span>
              <span>
                Last version:{' '}
                {templateMeta?.version ? `v${templateMeta.version}` : '—'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              disabled={isPending || fields.length === 0}
              onClick={onSaveDraft}
              type="button"
            >
              {isPending ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <SaveIcon className="mr-2 size-4" />
              )}
              Save draft
            </Button>
            <Button
              disabled={isPending || hasErrors || fields.length === 0}
              onClick={onPublish}
              type="button"
              variant="secondary"
            >
              {isPending ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <SparklesIcon className="mr-2 size-4" />
              )}
              Publish template
            </Button>
            <Button
              disabled={
                isPending || (fields.length === 0 && templateName === '')
              }
              onClick={onReset}
              type="button"
              variant="ghost"
            >
              <ArchiveRestoreIcon className="mr-2 size-4" />
              Reset builder
            </Button>
          </div>

          {fieldErrorCount > 0 ? (
            <p className="text-amber-600 text-sm">
              {fieldErrorCount} field validation{' '}
              {fieldErrorCount === 1 ? 'issue' : 'issues'} to review.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live schema preview</CardTitle>
          <CardDescription>
            Validated payload that the API will receive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[320px] overflow-auto rounded-md bg-muted/60 p-4 text-xs leading-relaxed">
            {JSON.stringify(
              validation.success ? validation.data : draftPayload,
              null,
              2,
            )}
          </pre>
        </CardContent>
      </Card>
    </aside>
  )
}
