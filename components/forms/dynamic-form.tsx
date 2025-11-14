'use client'

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { SignaturePad, type SignatureValue } from '@/components/signature-pad'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import type { FieldInput, TemplateDraftInput } from '@/lib/templates/schema'
import { cn } from '@/lib/utils'

type FormValues = Record<string, unknown>

export type DynamicFormSubmitMeta = {
  signatureFieldId: string | null
  signature: SignatureValue | null
}

type DynamicFormProps = {
  schema: TemplateDraftInput
  initialValues?: FormValues
  onSubmit: (
    values: FormValues,
    meta: DynamicFormSubmitMeta,
  ) => Promise<void> | void
  onAutosave?: (values: FormValues) => void
  isSubmitting?: boolean
  branding?: TemplateDraftInput['branding'] | null
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

function buildDefaultValues(
  fields: TemplateDraftInput['fields'],
  initialValues?: FormValues,
): FormValues {
  const base: FormValues = { ...(initialValues ?? {}) }
  for (const field of fields) {
    if (field.id in base) {
      if (field.type === 'checkbox') {
        base[field.id] = coerceCheckboxValue(base[field.id])
      }
      continue
    }
    if (field.type === 'checkbox') {
      base[field.id] = field.defaultValue ?? false
      continue
    }
    if (field.type === 'signature') {
      base[field.id] = null
      continue
    }
    base[field.id] = ''
  }
  return base
}

function coerceCheckboxValue(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'on'
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return Boolean(value)
}

function getPhonePattern(field: FieldInput): RegExp | null {
  if (field.type !== 'phone' || !field.pattern) {
    return null
  }
  try {
    return new RegExp(field.pattern)
  } catch {
    return null
  }
}

export function DynamicForm({
  schema,
  initialValues,
  onSubmit,
  onAutosave,
  isSubmitting = false,
  branding,
}: DynamicFormProps) {
  const defaultValues = useMemo(
    () => buildDefaultValues(schema.fields, initialValues),
    [initialValues, schema.fields],
  )

  const signatureField = useMemo(
    () => schema.fields.find((field) => field.type === 'signature') ?? null,
    [schema.fields],
  )

  const form = useForm<FormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues,
  })

  const previousDefaultValuesRef = useRef<string>('')
  useEffect(() => {
    const currentValuesString = JSON.stringify(defaultValues)
    if (previousDefaultValuesRef.current !== currentValuesString) {
      previousDefaultValuesRef.current = currentValuesString
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  const autosaveTimeoutRef = useRef<number | null>(null)
  useEffect(() => {
    if (!onAutosave) {
      return
    }

    const subscription = form.watch((values, { type }) => {
      if (type !== 'change') {
        return
      }
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current)
      }
      autosaveTimeoutRef.current = window.setTimeout(() => {
        onAutosave(values)
      }, 800)
    })

    return () => {
      subscription.unsubscribe()
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current)
        autosaveTimeoutRef.current = null
      }
    }
  }, [form, onAutosave])

  const handleSubmit = useCallback(
    async (values: FormValues) => {
      const signatureValue = signatureField
        ? ((values[signatureField.id] as SignatureValue | null) ?? null)
        : null

      await onSubmit(values, {
        signatureFieldId: signatureField?.id ?? null,
        signature: signatureValue,
      })
    },
    [onSubmit, signatureField],
  )

  const handleInvalid = useCallback(() => {
    const errors = form.formState.errors
    const firstErrorKey = Object.keys(errors).at(0)
    if (firstErrorKey) {
      form.setFocus(firstErrorKey as keyof FormValues)
    }
    toast.error('Controlla i campi evidenziati e riprova.')
  }, [form])

  const accentBorder = branding?.accentColor
  const fieldContainerStyle = useMemo<CSSProperties | undefined>(
    () => (accentBorder ? { borderColor: accentBorder } : undefined),
    [accentBorder],
  )
  const fieldContainerClass = cn(
    'space-y-2 rounded-lg border bg-background/80 p-4',
    'border-border',
  )

  return (
    <Form {...form}>
      <form
        className="space-y-8"
        noValidate
        onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
      >
        <div className="space-y-6">
          {schema.fields.map((field) => {
            if (field.type === 'content') {
              return (
                <div
                  className={cn(
                    fieldContainerClass,
                    field.align === 'center'
                      ? 'text-center'
                      : field.align === 'end'
                        ? 'text-right'
                        : 'text-left',
                  )}
                  key={field.id}
                  style={fieldContainerStyle}
                >
                  <div className="font-medium text-base">{field.label}</div>
                  <p className="whitespace-pre-line text-muted-foreground text-sm">
                    {field.content}
                  </p>
                </div>
              )
            }

            const fieldRules = buildFieldRules(field)

            return (
              <FormField
                control={form.control}
                key={field.id}
                name={field.id}
                render={({ field: controller }) => (
                  <FormItem
                    className={fieldContainerClass}
                    style={fieldContainerStyle}
                  >
                    <div className="space-y-1">
                      <FormLabel>
                        {field.label}
                        {field.required ? (
                          <span className="ml-1 text-destructive">*</span>
                        ) : null}
                      </FormLabel>
                      {field.helperText && field.type !== 'checkbox' ? (
                        <FormDescription>{field.helperText}</FormDescription>
                      ) : null}
                    </div>
                    <FormControl>
                      {renderFieldControl({
                        field,
                        controller,
                        isSubmitting,
                        branding,
                      })}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                rules={fieldRules}
              />
            )
          })}
        </div>

        <Button
          aria-busy={isSubmitting}
          className="w-full"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Invio in corso...' : 'Invia modulo'}
        </Button>
      </form>
    </Form>
  )
}

function buildFieldRules(field: FieldInput) {
  const rules: Record<string, unknown> = {}

  if (field.type === 'content') {
    return rules
  }

  if (field.required && field.type !== 'checkbox') {
    rules.required = 'Questo campo è obbligatorio.'
  }

  if (field.type === 'email') {
    rules.pattern = {
      value: EMAIL_REGEX,
      message: "Inserisci un'indirizzo email valido.",
    }
  }

  if (field.type === 'phone') {
    const pattern = getPhonePattern(field)
    if (pattern) {
      rules.validate = (value: unknown) => {
        if (typeof value !== 'string' || value.length === 0) {
          return field.required ? 'Questo campo è obbligatorio.' : true
        }
        const trimmed = value.trim()
        return pattern.test(trimmed)
          ? true
          : 'Inserisci un numero di telefono nel formato corretto.'
      }
    }
  }

  if (field.type === 'date') {
    rules.validate = (value: unknown) => {
      if (!value || typeof value !== 'string') {
        return field.required ? 'Questo campo è obbligatorio.' : true
      }
      const timestamp = Date.parse(value)
      if (Number.isNaN(timestamp)) {
        return 'Inserisci una data valida.'
      }
      if (field.min && value < field.min) {
        return `La data deve essere successiva o uguale al ${field.min}.`
      }
      if (field.max && value > field.max) {
        return `La data deve essere precedente o uguale al ${field.max}.`
      }
      return true
    }
  }

  if (field.type === 'signature') {
    rules.validate = (value: unknown) => {
      if (!field.required) {
        return true
      }
      const signature = value as SignatureValue | null
      return signature?.dataUrl
        ? true
        : 'È necessario fornire una firma per continuare.'
    }
  }

  if (field.type === 'checkbox' && field.required) {
    rules.validate = (value: unknown) =>
      value === true ? true : 'Questo campo è obbligatorio.'
  }

  return rules
}

function renderFieldControl({
  field,
  controller,
  isSubmitting,
  branding,
}: {
  field: FieldInput
  controller: {
    value: unknown
    onChange: (value: unknown) => void
    onBlur: () => void
  }
  isSubmitting: boolean
  branding: TemplateDraftInput['branding'] | null
}) {
  if (field.type === 'content') {
    return null
  }

  const commonInputProps = {
    onBlur: controller.onBlur,
    disabled: isSubmitting,
    placeholder: field.placeholder,
    'aria-required': field.required,
  } as const

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'date': {
      const inputType =
        field.type === 'text'
          ? 'text'
          : field.type === 'email'
            ? 'email'
            : field.type === 'date'
              ? 'date'
              : 'tel'
      const inputMode =
        field.type === 'phone'
          ? 'tel'
          : field.type === 'email'
            ? 'email'
            : undefined
      const maxLength = field.type === 'text' ? field.maxLength : undefined
      return (
        <Input
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(event) => controller.onChange(event.target.value)}
          type={inputType}
          value={(controller.value as string) ?? ''}
          {...commonInputProps}
        />
      )
    }
    case 'textarea': {
      return (
        <Textarea
          maxLength={field.maxLength}
          onChange={(event) => controller.onChange(event.target.value)}
          rows={4}
          value={(controller.value as string) ?? ''}
          {...commonInputProps}
        />
      )
    }
    case 'checkbox': {
      return (
        <div className="flex items-center gap-3">
          <Checkbox
            aria-required={field.required}
            checked={Boolean(controller.value)}
            disabled={isSubmitting}
            onCheckedChange={(nextValue) =>
              controller.onChange(Boolean(nextValue))
            }
          />
          <span className="text-muted-foreground text-sm">
            {field.helperText ?? 'Seleziona per confermare.'}
          </span>
        </div>
      )
    }
    case 'radio': {
      return (
        <RadioGroup
          className="space-y-3"
          onValueChange={controller.onChange}
          value={(controller.value as string) ?? ''}
        >
          {field.options.map((option) => (
            <div
              className="flex items-center gap-3 rounded-md border border-input bg-background/70 p-3"
              key={option.id}
            >
              <RadioGroupItem
                disabled={isSubmitting}
                id={`${field.id}-${option.id}`}
                value={option.id}
              />
              <label
                className="text-muted-foreground text-sm leading-tight"
                htmlFor={`${field.id}-${option.id}`}
              >
                {option.label}
              </label>
            </div>
          ))}
        </RadioGroup>
      )
    }
    case 'signature': {
      return (
        <SignaturePad
          acknowledgementText={field.acknowledgementText}
          disabled={isSubmitting}
          onChange={controller.onChange}
          required={field.required}
          style={
            branding?.accentColor
              ? { borderColor: branding.accentColor }
              : undefined
          }
          value={(controller.value as SignatureValue | null) ?? null}
        />
      )
    }
    default: {
      return null
    }
  }
}
