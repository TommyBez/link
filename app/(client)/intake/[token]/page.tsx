import Image from 'next/image'
import { notFound } from 'next/navigation'
import { IntakeFormShell } from '@/components/forms/intake-form-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { db } from '@/lib/db'
import type { TemplateDraftInput } from '@/lib/templates/schema'

type PageParams = {
  params: { token: string }
  searchParams?: Record<string, string | string[] | undefined>
}

type IntakeStatus = 'pending' | 'completed' | 'expired'

function isExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) {
    return false
  }
  return expiresAt.getTime() <= Date.now()
}

function formatDateTime(
  input: Date | string | null | undefined,
): string | null {
  if (!input) {
    return null
  }

  const date = typeof input === 'string' ? new Date(input) : input
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

function toSearchParams(
  searchParams: PageParams['searchParams'],
): URLSearchParams {
  const params = new URLSearchParams()

  if (!searchParams) {
    return params
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'undefined') {
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }
      continue
    }
    params.set(key, value)
  }

  return params
}

function extractPrefill(
  searchParams: URLSearchParams,
  schema: TemplateDraftInput,
): Record<string, string> {
  const allowedFieldIds = new Set(schema.fields.map((field) => field.id))
  const prefill: Record<string, string> = {}

  for (const [key, value] of searchParams.entries()) {
    if (!allowedFieldIds.has(key)) {
      continue
    }
    if (!value) {
      continue
    }
    prefill[key] = value
  }

  return prefill
}

function getSessionStatus(
  sessionStatus: string,
  expired: boolean,
): IntakeStatus {
  if (sessionStatus === 'completed') {
    return 'completed'
  }

  if (expired) {
    return 'expired'
  }

  return 'pending'
}

function statusBadgeVariant(
  status: IntakeStatus,
): 'default' | 'secondary' | 'destructive' {
  if (status === 'completed') {
    return 'default'
  }

  if (status === 'expired') {
    return 'destructive'
  }

  return 'secondary'
}

function statusLabel(status: IntakeStatus): string {
  if (status === 'completed') {
    return 'Completato'
  }

  if (status === 'expired') {
    return 'Scaduto'
  }

  return 'In corso'
}

export default async function IntakePage({ params, searchParams }: PageParams) {
  const { token } = params

  const session = await db.query.intakeSessions.findFirst({
    where: (sessionTable, { eq }) => eq(sessionTable.token, token),
    with: {
      templateVersion: {
        with: {
          template: true,
        },
      },
    },
  })

  if (!session) {
    return renderErrorState({
      title: 'Sessione non trovata',
      description:
        'Il link di intake che hai aperto non è valido oppure è stato revocato. Contatta il tuo referente per ricevere un nuovo link.',
    })
  }

  const templateVersion = session.templateVersion
  const template = templateVersion.template

  if (template.orgId !== session.orgId) {
    notFound()
  }

  const schema = templateVersion.schemaJson as TemplateDraftInput
  const expired = isExpired(session.expiresAt)
  const status = getSessionStatus(session.status, expired)
  const formattedExpiry = formatDateTime(session.expiresAt)
  const prefill = extractPrefill(toSearchParams(searchParams), schema)

  if (status === 'expired') {
    return renderExpiredState({
      templateTitle: template.name,
      expiresAt: formattedExpiry,
    })
  }

  if (status === 'completed') {
    return renderCompletedState({
      templateTitle: template.name,
    })
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="space-y-3 text-center">
        {schema.branding?.logoUrl ? (
          <div className="flex justify-center">
            <Image
              alt={`Logo di ${template.name}`}
              className="h-12 w-auto"
              height={80}
              priority
              src={schema.branding.logoUrl}
              width={160}
            />
          </div>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-balance font-semibold text-3xl text-foreground">
            {template.name}
          </h1>
          {schema.description ? (
            <p className="text-base text-muted-foreground">
              {schema.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <Badge variant={statusBadgeVariant(status)}>
            {statusLabel(status)}
          </Badge>
          {formattedExpiry ? (
            <span className="text-muted-foreground">
              Scade il {formattedExpiry}
            </span>
          ) : null}
        </div>
      </header>

      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Modulo di intake</CardTitle>
          <CardDescription>
            Compila i campi richiesti e firma per completare il processo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <IntakeFormShell
            branding={schema.branding ?? null}
            expiresAt={session.expiresAt.toISOString()}
            prefill={prefill}
            schema={schema}
            status={status}
            templateTitle={template.name}
            templateVersionId={templateVersion.id}
            token={token}
          />
        </CardContent>
      </Card>
    </main>
  )
}

function renderErrorState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter className="grid">
          <Button asChild variant="secondary">
            <a href="mailto:supporto@link-platform.it">Contatta il supporto</a>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

function renderExpiredState({
  templateTitle,
  expiresAt,
}: {
  templateTitle: string
  expiresAt: string | null
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Sessione scaduta</CardTitle>
          <CardDescription>
            La sessione per <strong>{templateTitle}</strong> non è più
            disponibile.
            {expiresAt ? ` È scaduta il ${expiresAt}.` : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertTitle>Cosa fare adesso</AlertTitle>
            <AlertDescription>
              Contatta il tuo referente per ricevere un nuovo link di intake e
              riprendere la compilazione.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="grid">
          <Button asChild variant="secondary">
            <a href="mailto:supporto@link-platform.it">
              Richiedi un nuovo link
            </a>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

function renderCompletedState({ templateTitle }: { templateTitle: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Modulo già inviato</CardTitle>
          <CardDescription>
            Hai già completato il modulo <strong>{templateTitle}</strong>.
            Grazie per averci fornito tutte le informazioni necessarie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertTitle>Grazie</AlertTitle>
            <AlertDescription>
              Abbiamo ricevuto tutte le informazioni necessarie. Puoi chiudere
              questa pagina o contattare il tuo referente per eventuali domande.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="grid">
          <Button asChild variant="secondary">
            <a href="mailto:supporto@link-platform.it">Contatta il supporto</a>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
