import {
  Document,
  Page,
  pdf,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

import type { FieldInput, TemplateDraftInput } from '@/lib/templates/schema'

import { ensurePdfFonts } from './fonts'

type SubmissionForPdf = {
  id: string
  createdAt: Date | string
  submittedAt?: Date | string | null
  responseData: Record<string, unknown> | null | undefined
  respondentName?: string | null
  respondentEmail?: string | null
  respondentPhone?: string | null
}

type TemplateForPdf = {
  name: string
  version: number
  schema: TemplateDraftInput
}

type OrgForPdf = {
  name: string
}

type SignatureForPdf = {
  signerName: string
  signedAtUtc: Date | string
  ipAddress?: string | null
  userAgent?: string | null
  blobUrl?: string | null
}

type SubmissionPdfPayload = {
  submission: SubmissionForPdf
  template: TemplateForPdf
  org: OrgForPdf
  signature?: SignatureForPdf | null
}

type NormalizedPayload = {
  submission: Omit<
    SubmissionForPdf,
    'createdAt' | 'submittedAt' | 'responseData'
  > & {
    createdAt: Date
    submittedAt: Date | null
    responseData: Record<string, unknown>
  }
  template: TemplateForPdf
  org: OrgForPdf
  signature?:
    | (Omit<SignatureForPdf, 'signedAtUtc'> & { signedAtUtc: Date })
    | null
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 12,
    lineHeight: 1.5,
    fontFamily: 'Inter',
    color: '#111827',
  },
  header: {
    marginBottom: 24,
  },
  orgName: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: 10,
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
  },
  fieldRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 11,
  },
  auditRow: {
    marginBottom: 6,
  },
  auditLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  auditValue: {
    fontSize: 11,
  },
  divider: {
    marginVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
})

export function createPdfBuffer(payload: SubmissionPdfPayload): Buffer {
  ensurePdfFonts()

  const normalized = normalizePayload(payload)
  const instance = pdf(<SubmissionDocument data={normalized} />)

  return instance.toBuffer()
}

function SubmissionDocument({ data }: { data: NormalizedPayload }) {
  const fields = getRenderableFields(data.template.schema)

  return (
    <Document title={`${data.template.name} – ${data.submission.id}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.orgName}>{data.org.name}</Text>
          <Text style={styles.templateName}>{data.template.name}</Text>
          <Text style={styles.templateMeta}>
            Versione {data.template.version} • Inviato il{' '}
            {formatDateTime(
              data.submission.submittedAt ?? data.submission.createdAt,
            )}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risposte del modulo</Text>
          {fields.length === 0 && (
            <Text style={styles.fieldValue}>Nessun campo da mostrare.</Text>
          )}
          {fields.map((field) => (
            <View key={field.id} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>
                {formatFieldValue(field, data.submission.responseData)}
              </Text>
            </View>
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Audit trail</Text>
        <AuditRow label="ID sottomissione" value={data.submission.id} />
        <AuditRow label="Organizzazione" value={data.org.name} />
        <AuditRow
          label="Template"
          value={`${data.template.name} (v${data.template.version})`}
        />
        <AuditRow
          label="Creato il"
          value={formatDateTime(data.submission.createdAt)}
        />
        <AuditRow
          label="Inviato il"
          value={formatDateTime(data.submission.submittedAt)}
        />
        <View style={styles.divider} />
        <AuditRow
          label="Nome rispondente"
          value={data.submission.respondentName}
        />
        <AuditRow
          label="Email rispondente"
          value={data.submission.respondentEmail}
        />
        <AuditRow
          label="Telefono rispondente"
          value={data.submission.respondentPhone}
        />
        <View style={styles.divider} />
        <AuditRow label="IP cliente" value={data.signature?.ipAddress} />
        <AuditRow label="User agent" value={data.signature?.userAgent} />
        <AuditRow label="Firmato da" value={data.signature?.signerName} />
        <AuditRow
          label="Firma registrata il"
          value={formatDateTime(data.signature?.signedAtUtc ?? null)}
        />
        <AuditRow label="Riferimento firma" value={data.signature?.blobUrl} />
      </Page>
    </Document>
  )
}

function AuditRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.auditRow}>
      <Text style={styles.auditLabel}>{label}</Text>
      <Text style={styles.auditValue}>
        {value && value.trim().length > 0 ? value : '—'}
      </Text>
    </View>
  )
}

function normalizePayload(payload: SubmissionPdfPayload): NormalizedPayload {
  return {
    submission: {
      ...payload.submission,
      createdAt: toDate(payload.submission.createdAt) ?? new Date(),
      submittedAt: toDate(payload.submission.submittedAt),
      responseData: sanitizeResponses(payload.submission.responseData),
      respondentName: payload.submission.respondentName ?? null,
      respondentEmail: payload.submission.respondentEmail ?? null,
      respondentPhone: payload.submission.respondentPhone ?? null,
    },
    template: payload.template,
    org: payload.org,
    signature: payload.signature
      ? {
          ...payload.signature,
          signedAtUtc: toDate(payload.signature.signedAtUtc) ?? new Date(),
          ipAddress: payload.signature.ipAddress ?? null,
          userAgent: payload.signature.userAgent ?? null,
          blobUrl: payload.signature.blobUrl ?? null,
        }
      : null,
  }
}

function sanitizeResponses(
  responses: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
    return {}
  }
  return responses
}

function getRenderableFields(schema: TemplateDraftInput): FieldInput[] {
  return schema.fields.filter((fieldItem) => fieldItem.type !== 'content')
}

function formatFieldValue(
  field: FieldInput,
  responses: Record<string, unknown>,
): string {
  const raw = responses[field.id]

  if (raw === null || raw === undefined) {
    return field.type === 'signature' ? 'Firma mancante' : '—'
  }

  switch (field.type) {
    case 'checkbox':
      return formatCheckboxValue(raw)
    case 'radio':
      return formatRadioValue(raw, field.options)
    case 'date':
      return formatDateValue(raw)
    case 'signature':
      return formatSignatureValue(raw)
    default:
      return formatDefaultValue(raw)
  }
}

function formatCheckboxValue(raw: unknown): string {
  return truthy(raw) ? 'Sì' : 'No'
}

function formatRadioValue(
  raw: unknown,
  options: FieldInput['options'],
): string {
  if (typeof raw !== 'string') {
    return '—'
  }
  const option = options.find((item) => item.id === raw)
  return option?.label ?? raw
}

function formatDateValue(raw: unknown): string {
  const parsed = toDate(raw)
  return parsed ? formatDate(parsed) : String(raw)
}

function formatSignatureValue(raw: unknown): string {
  return truthy(raw) ? 'Firma acquisita' : 'Firma mancante'
}

function formatDefaultValue(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw
  }
  if (typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw)
  }
  try {
    return JSON.stringify(raw)
  } catch {
    return '—'
  }
}

function truthy(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0 && value !== 'false'
  }
  return Boolean(value)
}

function toDate(value: unknown): Date | null {
  if (!value) {
    return null
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(value)
}

function formatDateTime(value: Date | null): string {
  if (!value) {
    return '—'
  }
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

export type { SubmissionPdfPayload }
