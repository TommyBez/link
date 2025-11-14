'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PdfArtifactStatus } from '@/lib/db/schema'

type PdfPanelProps = {
  submissionId: string
  initialStatus: PdfStatusState
}

type ApiResponse = {
  status: string
  workflowRunId?: string | null
  blobUrl?: string | null
  sizeBytes?: number | null
  checksum?: string | null
  error?: string | null
}

export type PdfStatusState =
  | {
      status: 'not_started'
      workflowRunId?: null
      blobUrl?: null
      sizeBytes?: null
      checksum?: null
      error?: null
    }
  | {
      status: PdfArtifactStatus
      workflowRunId: string | null
      blobUrl: string | null
      sizeBytes: number | null
      checksum: string | null
      error: string | null
    }

const statusLabels: Record<PdfStatusState['status'], string> = {
  not_started: 'Non generato',
  queued: 'In coda',
  generating: 'In generazione',
  ready: 'Pronto',
  failed: 'Errore',
}

const statusVariant: Record<
  PdfStatusState['status'],
  'default' | 'secondary' | 'destructive'
> = {
  not_started: 'secondary',
  queued: 'secondary',
  generating: 'secondary',
  ready: 'default',
  failed: 'destructive',
}

export function PdfPanel({ submissionId, initialStatus }: PdfPanelProps) {
  const [status, setStatus] = useState<PdfStatusState>(initialStatus)
  const [action, setAction] = useState<'idle' | 'generate' | 'retry'>('idle')
  const [formError, setFormError] = useState<string | null>(null)

  const normalize = useCallback(
    (payload: Partial<ApiResponse>): PdfStatusState => {
      if (payload.status === 'not_started' || !payload.status) {
        return {
          status: 'not_started',
          workflowRunId: null,
          blobUrl: null,
          sizeBytes: null,
          checksum: null,
          error: null,
        }
      }

      return {
        status: payload.status as PdfArtifactStatus,
        workflowRunId: payload.workflowRunId ?? null,
        blobUrl: payload.blobUrl ?? null,
        sizeBytes: payload.sizeBytes ?? null,
        checksum: payload.checksum ?? null,
        error: payload.error ?? null,
      }
    },
    [],
  )

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/pdf/${submissionId}/status`, {
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error('Status request failed')
      }
      const body = (await response.json()) as ApiResponse
      setStatus(normalize(body))
    } catch (error) {
      console.error(error)
      setFormError('Impossibile aggiornare lo stato del PDF.')
    }
  }, [normalize, submissionId])

  useEffect(() => {
    if (status.status !== 'queued' && status.status !== 'generating') {
      return
    }

    const interval = setInterval(() => {
      refreshStatus().catch(() => null)
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [refreshStatus, status.status])

  const handleGenerate = useCallback(async () => {
    setAction('generate')
    setFormError(null)
    try {
      const response = await fetch(`/api/pdf/${submissionId}/generate`, {
        method: 'POST',
      })
      const body = (await response.json()) as ApiResponse
      if (!response.ok) {
        throw new Error(body.error ?? 'Impossibile avviare la generazione.')
      }
      setStatus(normalize(body))
    } catch (error) {
      console.error(error)
      setFormError(
        error instanceof Error
          ? error.message
          : 'Impossibile avviare la generazione del PDF.',
      )
    } finally {
      setAction('idle')
    }
  }, [normalize, submissionId])

  const handleRetry = useCallback(async () => {
    setAction('retry')
    setFormError(null)
    try {
      const response = await fetch(`/api/pdf/${submissionId}/retry`, {
        method: 'POST',
      })
      const body = (await response.json()) as ApiResponse
      if (!response.ok) {
        throw new Error(body.error ?? 'Impossibile riavviare la generazione.')
      }
      setStatus(normalize(body))
    } catch (error) {
      console.error(error)
      setFormError(
        error instanceof Error
          ? error.message
          : 'Impossibile riavviare la generazione del PDF.',
      )
    } finally {
      setAction('idle')
    }
  }, [normalize, submissionId])

  const formattedSize = useMemo(() => {
    if (!status.sizeBytes) {
      return '—'
    }
    if (status.sizeBytes < 1024) {
      return `${status.sizeBytes} B`
    }
    return `${(status.sizeBytes / 1024).toFixed(1)} KB`
  }, [status.sizeBytes])

  const showGenerate = status.status === 'not_started'
  const showRetry = status.status === 'failed'
  const showDownload = status.status === 'ready'

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-muted-foreground text-sm">PDF</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariant[status.status]}>
              {statusLabels[status.status]}
            </Badge>
            {status.status === 'queued' || status.status === 'generating' ? (
              <span className="text-muted-foreground text-xs">
                Aggiornamento automatico ogni 5s
              </span>
            ) : null}
          </div>
        </div>
        <Button
          aria-label="Aggiorna stato"
          disabled={action !== 'idle'}
          onClick={() => refreshStatus()}
          size="icon"
          variant="ghost"
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Workflow run ID</dt>
          <dd className="font-mono text-xs">{status.workflowRunId ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dimensione</dt>
          <dd className="font-medium">{formattedSize}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Checksum</dt>
          <dd className="font-mono text-xs">{status.checksum ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Errore</dt>
          <dd className="text-destructive text-sm">{status.error ?? '—'}</dd>
        </div>
      </dl>

      {formError ? (
        <p className="mt-4 text-destructive text-sm">{formError}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {showGenerate ? (
          <Button disabled={action !== 'idle'} onClick={handleGenerate}>
            {action === 'generate' ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Genera PDF
          </Button>
        ) : null}

        {showRetry ? (
          <Button
            disabled={action !== 'idle'}
            onClick={handleRetry}
            variant="secondary"
          >
            {action === 'retry' ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Riprova generazione
          </Button>
        ) : null}

        {showDownload ? (
          <Button asChild variant="outline">
            <a
              href={`/api/pdf/${submissionId}/download`}
              rel="noreferrer"
              target="_blank"
            >
              Scarica PDF
            </a>
          </Button>
        ) : null}

        {status.status === 'queued' || status.status === 'generating' ? (
          <Button disabled variant="outline">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Generazione in corso
          </Button>
        ) : null}
      </div>
    </div>
  )
}
