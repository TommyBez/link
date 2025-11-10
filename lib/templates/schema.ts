import { z } from 'zod'

export const fieldId = z
  .string()
  .min(1, 'L\'id del campo è obbligatorio')
  .regex(/^[a-zA-Z0-9_-]+$/, 'L\'id del campo deve essere alfanumerico con - o _')

const fieldBase = z.object({
  id: fieldId,
  label: z.string().min(1, 'L\'etichetta del campo è obbligatoria'),
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
    .regex(/^\+?[0-9()\s-]+$/, 'Il formato del telefono non è valido')
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
          .min(1, 'L\'id dell\'opzione è obbligatorio')
          .regex(
            /^[a-zA-Z0-9_-]+$/,
            'L\'id dell\'opzione deve essere alfanumerico con - o _',
          ),
        label: z.string().min(1, 'L\'etichetta dell\'opzione è obbligatoria'),
      }),
    )
    .min(2, 'Il campo radio richiede almeno due opzioni'),
})

const contentField = fieldBase
  .omit({ placeholder: true, required: true })
  .extend({
    type: z.literal('content'),
    content: z
      .string()
      .min(1, 'Il testo del blocco contenuto è obbligatorio')
      .max(3000, 'Il blocco contenuto è troppo lungo'),
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
      .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Il colore primario deve essere un valore esadecimale')
      .optional(),
    accentColor: z
      .string()
      .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Il colore di accento deve essere un valore esadecimale')
      .optional(),
  })
  .optional()

export const templateDraft = z.object({
  name: z.string().min(1, 'Il nome del template è obbligatorio'),
  description: z.string().max(500).optional(),
  locale: z.string().optional().default('it-IT'),
  branding: templateBranding,
  fields: z.array(field).min(1, 'Il template richiede almeno un campo'),
})

export const templatePublishPayload = z.object({
  templateId: z.uuid(),
  payload: templateDraft,
})

export type FieldInput = z.infer<typeof field>
export type TemplateDraftInput = z.infer<typeof templateDraft>
export type TemplatePublishPayload = z.infer<typeof templatePublishPayload>
