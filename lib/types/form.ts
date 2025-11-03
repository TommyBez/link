export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "date"
  | "checkbox"
  | "radio"
  | "select"
  | "signature"
  | "text_block"
  | "heading"
  | "divider"

export interface FormField {
  id: string
  fieldType: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  order: number
  validationRules?: Record<string, unknown>
}

export interface FormData {
  id?: string
  title: string
  description: string
  isActive: boolean
  fields: FormField[]
}
