import { z } from 'zod'

export const fieldId = z
  .string()
  .min(1, 'Field id is required')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Field id must be alphanumeric with - or _')

const fieldBase = z.object({
  id: fieldId,
  label: z.string().min(1, 'Field label is required'),
  helperText: z.string().max(500).optional(),
  required: z.boolean().default(false),
  placeholder: z.string().max(255).optional(),
})

const textField = fieldBase.extend({
  type: z.literal('text'),
  maxLength: z.number().int().positive().optional(),
})

const textareaField = fieldBase.extend({
  type: z.literal('textarea'),
  maxLength: z.number().int().positive().optional(),
})

const emailField = fieldBase.extend({
  type: z.literal('email'),
})

const phoneField = fieldBase.extend({
  type: z.literal('phone'),
  pattern: z
    .string()
    .regex(/^\+?[0-9()\s-]+$/, 'Phone format is invalid')
    .optional(),
})

const dateField = fieldBase.extend({
  type: z.literal('date'),
  min: z.string().optional(),
  max: z.string().optional(),
})

const checkboxField = fieldBase.extend({
  type: z.literal('checkbox'),
  defaultValue: z.boolean().optional(),
})

const radioField = fieldBase.extend({
  type: z.literal('radio'),
  options: z
    .array(
      z.object({
        id: z
          .string()
          .min(1, 'Option id is required')
          .regex(
            /^[a-zA-Z0-9_-]+$/,
            'Option id must be alphanumeric with - or _',
          ),
        label: z.string().min(1, 'Option label is required'),
      }),
    )
    .min(2, 'Radio field requires at least two options'),
})

const contentField = fieldBase
  .omit({ placeholder: true, required: true })
  .extend({
    type: z.literal('content'),
    content: z
      .string()
      .min(1, 'Content block text is required')
      .max(3000, 'Content block is too long'),
    align: z.enum(['start', 'center', 'end']).optional(),
  })

const signatureField = fieldBase.extend({
  type: z.literal('signature'),
  acknowledgementText: z.string().min(1).max(1000).optional(),
})

export const field = z.discriminatedUnion('type', [
  textField,
  textareaField,
  emailField,
  phoneField,
  dateField,
  checkboxField,
  radioField,
  contentField,
  signatureField,
])

const templateBranding = z
  .object({
    logoUrl: z.string().url().optional(),
    primaryColor: z
      .string()
      .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Primary color must be a hex value')
      .optional(),
    accentColor: z
      .string()
      .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Accent color must be a hex value')
      .optional(),
  })
  .optional()

export const templateDraft = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().max(500).optional(),
  locale: z.string().optional().default('it-IT'),
  branding: templateBranding,
  fields: z.array(field).min(1, 'Template requires at least one field'),
})

export const templatePublishPayload = z.object({
  templateId: z.string().uuid(),
  payload: templateDraft,
})

export type FieldInput = z.infer<typeof field>
export type TemplateDraftInput = z.infer<typeof templateDraft>
export type TemplatePublishPayload = z.infer<typeof templatePublishPayload>
