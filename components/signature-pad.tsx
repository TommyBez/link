'use client'

import type { HTMLAttributes } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SignatureValue = {
  dataUrl: string
}

type SignaturePadProps = {
  value: SignatureValue | null
  onChange: (value: SignatureValue | null) => void
  required?: boolean
  acknowledgementText?: string
  disabled?: boolean
} & Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'children'>

export function SignaturePad({
  value,
  onChange,
  required = false,
  acknowledgementText,
  disabled = false,
  className,
  tabIndex,
  ...interactiveProps
}: SignaturePadProps) {
  const canvasRef = useRef<SignatureCanvas | null>(null)

  const syncCanvasWithValue = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    canvas.clear()
    if (value?.dataUrl) {
      canvas.fromDataURL(value.dataUrl)
    }
  }, [value])

  useEffect(() => {
    syncCanvasWithValue()
  }, [syncCanvasWithValue])

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    if (disabled) {
      return
    }
    canvas.clear()
    onChange(null)
  }, [disabled, onChange])

  const handleEnd = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    if (disabled) {
      return
    }
    if (canvas.isEmpty()) {
      onChange(null)
      return
    }
    const trimmed = canvas.getTrimmedCanvas()
    const dataUrl = trimmed.toDataURL('image/png')
    onChange({
      dataUrl,
    })
  }, [disabled, onChange])

  return (
    <div className={cn('space-y-3', className)}>
      <fieldset
        aria-label="Firma con il dito o il mouse"
        className={cn(
          'rounded-lg border bg-muted/40 p-3 transition-[border-color,box-shadow]',
          'focus-within:border-primary focus-within:shadow-sm',
          disabled ? 'opacity-70' : 'border-border',
        )}
        disabled={disabled}
        {...interactiveProps}
      >
        <SignatureCanvas
          canvasProps={{
            className: 'h-48 w-full bg-background',
            style: {
              pointerEvents: disabled ? 'none' : 'auto',
            },
            tabIndex: typeof tabIndex === 'number' ? tabIndex : 0,
          }}
          maxWidth={2.8}
          minWidth={0.8}
          onEnd={handleEnd}
          penColor="#111827"
          ref={canvasRef}
          throttle={16}
        />
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">
          Firma con il dito o il mouse. Usa il pulsante per cancellare.
          {required ? ' Campo obbligatorio.' : ''}
        </span>
        <Button
          aria-label="Cancella firma"
          disabled={disabled}
          onClick={handleClear}
          size="sm"
          type="button"
          variant="outline"
        >
          Cancella firma
        </Button>
      </div>
      {acknowledgementText ? (
        <p className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground text-sm">
          {acknowledgementText}
        </p>
      ) : null}
    </div>
  )
}
