'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { HTMLAttributes } from 'react'

export type SignatureValue = {
  dataUrl: string
  signedAtClientUtc?: string
}

type SignaturePadProps = {
  value: SignatureValue | null
  onChange: (value: SignatureValue | null) => void
  required?: boolean
  acknowledgementText?: string
  disabled?: boolean
} & Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'>

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
  const [isFocused, setIsFocused] = useState(false)

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
      signedAtClientUtc: new Date().toISOString(),
    })
  }, [disabled, onChange])

  const resolvedTabIndex = typeof tabIndex === 'number' ? tabIndex : 0

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'rounded-lg border bg-muted/40 p-3 transition-[border-color,box-shadow]',
          isFocused ? 'border-primary shadow-sm' : 'border-border',
          disabled ? 'opacity-70' : null,
        )}
        role="group"
        aria-label="Firma con il dito o il mouse"
        tabIndex={resolvedTabIndex}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...interactiveProps}
      >
        <SignatureCanvas
          ref={canvasRef}
          penColor="#111827"
          minWidth={0.8}
          maxWidth={2.8}
          throttle={16}
          onEnd={handleEnd}
          canvasProps={{
            className: 'h-48 w-full bg-background',
            style: {
              pointerEvents: disabled ? 'none' : 'auto',
            },
          }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">
          Firma con il dito o il mouse. Usa il pulsante per cancellare.
          {required ? ' Campo obbligatorio.' : ''}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          aria-label="Cancella firma"
        >
          Cancella firma
        </Button>
      </div>
      {acknowledgementText ? (
        <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          {acknowledgementText}
        </p>
      ) : null}
    </div>
  )
}
