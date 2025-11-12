'use client'

import type { QRCodeRenderersOptions } from 'qrcode'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type QrCodeProps = {
  value: string
  size?: number
  className?: string
}

function clearCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to get 2d context')
  }
  context.clearRect(0, 0, canvas.width, canvas.height)
}

async function generateQRCode(
  canvas: HTMLCanvasElement,
  value: string,
  size: number,
): Promise<void> {
  const QRCode = await import('qrcode')
  const options: QRCodeRenderersOptions = {
    errorCorrectionLevel: 'M',
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  }
  await QRCode.toCanvas(canvas, value, options)
}

export function QrCode({ value, size = 180, className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let isCancelled = false

    async function draw() {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      if (!value) {
        clearCanvas(canvas)
        return
      }

      try {
        if (isCancelled) {
          return
        }

        await generateQRCode(canvas, value, size)
      } catch (error) {
        console.error('Impossibile generare il QR code', error)
      }
    }

    draw()

    return () => {
      isCancelled = true
    }
  }, [size, value])

  return (
    <canvas
      aria-label="QR code"
      className={cn('rounded-lg border bg-white p-3 shadow-sm', className)}
      ref={canvasRef}
      role="img"
    />
  )
}
