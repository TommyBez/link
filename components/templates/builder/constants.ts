import type { BrandingState, FieldCatalogItem, PaletteOption } from './types'

export const COLOR_PALETTES: PaletteOption[] = [
  { name: 'Classico', primary: '#2563eb', accent: '#9333ea' },
  { name: 'Smeraldo', primary: '#047857', accent: '#22c55e' },
  { name: 'Ardesia', primary: '#0f172a', accent: '#475569' },
  { name: 'Alba', primary: '#ea580c', accent: '#facc15' },
]

export const DEFAULT_BRANDING: BrandingState = {
  logoUrl: '',
  primaryColor: COLOR_PALETTES[0]?.primary ?? '#2563eb',
  accentColor: COLOR_PALETTES[0]?.accent ?? '#9333ea',
}

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/

export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value)
}

export const INITIAL_CATALOG: FieldCatalogItem[] = [
  {
    type: 'text',
    label: 'Testo breve',
    description: 'Input a riga singola per risposte brevi.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'text',
      label: 'Domanda a testo breve',
      helperText: '',
      required: false,
      placeholder: 'Inserisci risposta',
    }),
  },
  {
    type: 'textarea',
    label: 'Testo lungo',
    description: 'Input multilinea per risposte dettagliate.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'textarea',
      label: 'Domanda a testo lungo',
      helperText: '',
      required: false,
      placeholder: 'Scrivi la tua risposta',
    }),
  },
  {
    type: 'email',
    label: 'Email',
    description: 'Raccogli un indirizzo email.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'email',
      label: 'Indirizzo email',
      helperText: 'Invieremo le notifiche a questo indirizzo email.',
      required: true,
      placeholder: 'nome@esempio.com',
    }),
  },
  {
    type: 'phone',
    label: 'Telefono',
    description: 'Raccogli un numero di telefono.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'phone',
      label: 'Numero di telefono',
      helperText: 'Includi il prefisso internazionale se fuori dall\'Italia.',
      required: false,
      placeholder: '+39 123 456 7890',
    }),
  },
  {
    type: 'date',
    label: 'Data',
    description: 'Selettore di data calendario.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'date',
      label: 'Data',
      helperText: '',
      required: false,
    }),
  },
  {
    type: 'checkbox',
    label: 'Casella di controllo',
    description: 'Singola casella di controllo per riconoscimento.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'checkbox',
      label: 'Accetto i termini sopra indicati',
      helperText: '',
      required: true,
      defaultValue: false,
    }),
  },
  {
    type: 'radio',
    label: 'Scelta multipla',
    description: 'Scegli una singola opzione da un elenco.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'radio',
      label: 'Seleziona un\'opzione',
      helperText: '',
      required: false,
      options: [
        { id: crypto.randomUUID(), label: 'Opzione A' },
        { id: crypto.randomUUID(), label: 'Opzione B' },
      ],
    }),
  },
  {
    type: 'content',
    label: 'Blocco di testo',
    description: 'Contenuto statico per istruzioni o disclaimer.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'content',
      label: 'Blocco informativo',
      helperText: '',
      content:
        'Usa questo spazio per fornire contesto aggiuntivo o requisiti per i partecipanti.',
      align: 'start',
    }),
  },
  {
    type: 'signature',
    label: 'Firma',
    description: 'Cattura una firma digitale.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'signature',
      label: 'Firma',
      helperText:
        'Firma usando il dito o il mouse per confermare l\'accuratezza delle informazioni fornite.',
      required: true,
      acknowledgementText:
        'Certifico che le informazioni fornite sono accurate secondo la mia conoscenza.',
    }),
  },
]
