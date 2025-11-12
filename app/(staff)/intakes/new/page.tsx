'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { QrCode } from '@/components/qr-code'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
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

type TemplateVersionSummary = {
  id: string
  version: number
  publishedAt: string
}

type TemplateSummary = {
  id: string
  name: string
  versions: TemplateVersionSummary[]
}

type TemplatesResponse = {
  templates: Array<{
    id: string
    name: string
    latestPublished: {
      id: string
      version: number
      publishedAt: string
    } | null
    versions?: Array<{
      id: string
      version: number
      publishedAt: string
    }>
  }>
}

type IntakeSessionResponse = {
  token: string
  expiresAt: string
}

type IntakeStatus = 'pending' | 'completed' | 'expired'

function formatDate(input: string | null): string | null {
  if (!input) {
    return null
  }
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusVariant(
  status: IntakeStatus | null,
): 'default' | 'secondary' | 'destructive' {
  if (!status) {
    return 'secondary'
  }
  if (status === 'completed') {
    return 'default'
  }
  if (status === 'expired') {
    return 'destructive'
  }
  return 'secondary'
}

function statusLabel(status: IntakeStatus | null): string {
  if (!status) {
    return '—'
  }
  if (status === 'completed') {
    return 'Completato'
  }
  if (status === 'expired') {
    return 'Scaduto'
  }
  return 'In attesa'
}

export default function NewIntakePage() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  )
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [origin, setOrigin] = useState('')
  const [intakeToken, setIntakeToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [status, setStatus] = useState<IntakeStatus | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function loadTemplates() {
      setIsLoadingTemplates(true)
      try {
        const response = await fetch(
          '/api/templates?status=published&include=versions',
          {
            cache: 'no-store',
          },
        )

        if (!response.ok) {
          throw new Error(await response.text())
        }

        const body = (await response.json()) as TemplatesResponse

        if (isCancelled) {
          return
        }

        const items: TemplateSummary[] = body.templates
          .map((template) => {
            let versionsSource: Array<{
              id: string
              version: number
              publishedAt: string
            }>
            if (template.versions && template.versions.length > 0) {
              versionsSource = template.versions
            } else if (template.latestPublished) {
              versionsSource = [template.latestPublished]
            } else {
              versionsSource = []
            }

            const versions = versionsSource.map((version) => ({
              id: version.id,
              version: version.version,
              publishedAt: version.publishedAt,
            }))

            return {
              id: template.id,
              name: template.name,
              versions,
            }
          })
          .filter((template) => template.versions.length > 0)

        setTemplates(items)
        setSelectedTemplateId((previous) => previous ?? items.at(0)?.id ?? null)
      } catch (error) {
        console.error(error)
        toast.error('Impossibile caricare i template pubblicati.')
      } finally {
        if (!isCancelled) {
          setIsLoadingTemplates(false)
        }
      }
    }

    loadTemplates()

    return () => {
      isCancelled = true
    }
  }, [])

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) {
      return null
    }
    return (
      templates.find((template) => template.id === selectedTemplateId) ?? null
    )
  }, [selectedTemplateId, templates])

  useEffect(() => {
    if (!selectedTemplate) {
      setSelectedVersionId(null)
      return
    }

    if (
      !selectedTemplate.versions.some(
        (version) => version.id === selectedVersionId,
      ) &&
      selectedTemplate.versions.length > 0
    ) {
      setSelectedVersionId(selectedTemplate.versions[0]?.id ?? null)
    }
  }, [selectedTemplate, selectedVersionId])

  const shareUrl = useMemo(() => {
    if (!(origin && intakeToken)) {
      return ''
    }
    return `${origin}/intake/${intakeToken}`
  }, [origin, intakeToken])

  const formattedExpiresAt = useMemo(() => formatDate(expiresAt), [expiresAt])

  const handleCreateIntake = useCallback(async () => {
    if (!selectedVersionId) {
      toast.info('Seleziona un template pubblicato.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/intakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateVersionId: selectedVersionId }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const body = (await response.json()) as IntakeSessionResponse
      setIntakeToken(body.token)
      setExpiresAt(body.expiresAt)
      setStatus('pending')
      toast.success('Link di intake generato.')
    } catch (error) {
      console.error(error)
      toast.error('Impossibile generare la sessione. Riprova.')
    } finally {
      setIsGenerating(false)
    }
  }, [selectedVersionId])

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) {
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copiato negli appunti.')
    } catch (error) {
      console.error(error)
      toast.error('Impossibile copiare il link.')
    }
  }, [shareUrl])

  useEffect(() => {
    if (!intakeToken || status !== 'pending') {
      return
    }

    let isCancelled = false
    const POLLING_INTERVAL = 10_000

    async function pollStatus() {
      try {
        const response = await fetch(`/api/intakes/${intakeToken}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          if (response.status === 410) {
            const body = (await response.json()) as {
              status?: IntakeStatus
              expiresAt?: string
            }
            if (isCancelled) {
              return
            }
            setStatus(body.status ?? 'expired')
            if (body.expiresAt) {
              setExpiresAt(body.expiresAt)
            }
            return
          }
          throw new Error(await response.text())
        }

        const body = (await response.json()) as {
          status: IntakeStatus
          expiresAt: string | null
        }

        if (isCancelled) {
          return
        }
        setStatus(body.status)
        if (body.expiresAt) {
          setExpiresAt(body.expiresAt)
        }

        if (body.status !== 'pending') {
          return
        }
      } catch (error) {
        console.error(error)
      }
    }

    const interval = window.setInterval(pollStatus, POLLING_INTERVAL)
    pollStatus()

    return () => {
      isCancelled = true
      window.clearInterval(interval)
    }
  }, [intakeToken, status])

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-semibold text-3xl">Nuova sessione intake</h1>
        <p className="text-muted-foreground">
          Seleziona un template pubblicato, genera un link tokenizzato e
          condividilo tramite QR code o copia negli appunti.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Configurazione</CardTitle>
            <CardDescription>
              Scegli la versione pubblicata da distribuire e genera una nuova
              sessione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="font-medium text-foreground text-sm">
                Template pubblicato
              </div>
              <Select
                disabled={isLoadingTemplates || templates.length === 0}
                onValueChange={setSelectedTemplateId}
                value={selectedTemplateId ?? undefined}
              >
                <SelectTrigger className="min-w-[280px]">
                  <SelectValue placeholder="Seleziona un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.length === 0 && !isLoadingTemplates ? (
                <p className="text-muted-foreground text-sm">
                  Nessun template pubblicato disponibile. Pubblica un template
                  per procedere.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="font-medium text-foreground text-sm">
                Versione
              </div>
              <Select
                disabled={
                  !selectedTemplate || selectedTemplate.versions.length === 0
                }
                onValueChange={setSelectedVersionId}
                value={selectedVersionId ?? undefined}
              >
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Seleziona una versione" />
                </SelectTrigger>
                <SelectContent>
                  {selectedTemplate?.versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      v{version.version} ·{' '}
                      {formatDate(version.publishedAt) ?? 'Pubblicazione'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isGenerating || !selectedVersionId}
                onClick={handleCreateIntake}
              >
                {isGenerating ? 'Generazione…' : 'Genera link'}
              </Button>
              <Button
                disabled={!shareUrl}
                onClick={handleCopyLink}
                variant="outline"
              >
                Copia link
              </Button>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground text-sm">
                Stato sessione
              </p>
              <Badge variant={statusVariant(status)}>
                {statusLabel(status)}
              </Badge>
              <p className="text-muted-foreground text-sm">
                Una sessione rimane valida per 30 giorni dalla creazione.
              </p>
              {formattedExpiresAt ? (
                <p className="text-muted-foreground text-sm">
                  Scadenza: {formattedExpiresAt}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuzione</CardTitle>
            <CardDescription>
              Mostra il QR code ai clienti o condividi il link copiandolo negli
              appunti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="break-all rounded-lg border bg-muted/30 p-4 text-muted-foreground text-sm">
              {shareUrl || 'Il link sarà disponibile dopo la generazione.'}
            </div>
            {shareUrl ? (
              <div className="flex justify-center">
                <QrCode size={192} value={shareUrl} />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground text-sm">
                Genera una sessione per visualizzare il QR code.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Prefill rapido</CardTitle>
          <CardDescription>
            Aggiungi parametri di query all&apos;URL per precompilare i campi
            che hanno un id corrispondente. Esempio:{' '}
            <code>?email=jane@example.com</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground text-sm">
          <p>
            Gli identificativi devono corrispondere ai campi definiti nel
            template. I valori vengono applicati lato client quando il form
            viene caricato.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
