import type { BrandingState, FieldCatalogItem, PaletteOption } from './types'

export const COLOR_PALETTES: PaletteOption[] = [
  { name: 'Classic', primary: '#2563eb', accent: '#9333ea' },
  { name: 'Emerald', primary: '#047857', accent: '#22c55e' },
  { name: 'Slate', primary: '#0f172a', accent: '#475569' },
  { name: 'Sunrise', primary: '#ea580c', accent: '#facc15' },
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
    label: 'Short text',
    description: 'Single line input for short answers.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'text',
      label: 'Short text question',
      helperText: '',
      required: false,
      placeholder: 'Enter response',
    }),
  },
  {
    type: 'textarea',
    label: 'Long text',
    description: 'Multiline input for detailed responses.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'textarea',
      label: 'Long form question',
      helperText: '',
      required: false,
      placeholder: 'Type your response',
    }),
  },
  {
    type: 'email',
    label: 'Email',
    description: 'Collect an email address.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'email',
      label: 'Email address',
      helperText: 'We will send notifications to this email.',
      required: true,
      placeholder: 'name@example.com',
    }),
  },
  {
    type: 'phone',
    label: 'Phone',
    description: 'Collect a phone number.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'phone',
      label: 'Phone number',
      helperText: 'Include country code if outside the U.S.',
      required: false,
      placeholder: '+1 555 555 5555',
    }),
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Calendar date selector.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'date',
      label: 'Date',
      helperText: '',
      required: false,
    }),
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    description: 'Single acknowledgement checkbox.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'checkbox',
      label: 'I agree to the terms above',
      helperText: '',
      required: true,
      defaultValue: false,
    }),
  },
  {
    type: 'radio',
    label: 'Multiple choice',
    description: 'Choose a single option from a list.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'radio',
      label: 'Select an option',
      helperText: '',
      required: false,
      options: [
        { id: crypto.randomUUID(), label: 'Option A' },
        { id: crypto.randomUUID(), label: 'Option B' },
      ],
    }),
  },
  {
    type: 'content',
    label: 'Text block',
    description: 'Static copy for instructions or disclaimers.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'content',
      label: 'Information block',
      helperText: '',
      content:
        'Use this space to provide additional context or requirements for participants.',
      align: 'start',
    }),
  },
  {
    type: 'signature',
    label: 'Signature',
    description: 'Capture a digital signature.',
    create: () => ({
      id: crypto.randomUUID(),
      type: 'signature',
      label: 'Signature',
      helperText:
        'Sign using your finger or mouse to confirm the accuracy of the information provided.',
      required: true,
      acknowledgementText:
        'I certify that the information provided is accurate to the best of my knowledge.',
    }),
  },
]
