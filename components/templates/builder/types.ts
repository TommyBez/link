import type { FieldInput } from '@/lib/templates/schema'

export type FieldCatalogItem = {
  type: FieldInput['type']
  label: string
  description: string
  create: () => FieldInput
}

export type BrandingState = {
  logoUrl: string
  primaryColor: string
  accentColor: string
}

export type PaletteOption = {
  name: string
  primary: string
  accent: string
}

export type TemplateMeta = {
  id?: string
  version?: number
}
