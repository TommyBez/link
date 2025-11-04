'use client'

import type React from 'react'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const CANVAS_HEIGHT = 150

type SignatureCanvasProps = {
  onChange: (dataUrl: string) => void
}

export function SignatureCanvas({ onChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = CANVAS_HEIGHT

    // Set drawing styles
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    setIsDrawing(true)
    setIsEmpty(false)

    const rect = canvas.getBoundingClientRect()
    const x =
      'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y =
      'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x =
      'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y =
      'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) {
      return
    }
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    // Convert to data URL and notify parent
    const dataUrl = canvas.toDataURL('image/png')
    onChange(dataUrl)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange('')
  }

  return (
    <div className="space-y-2">
      <canvas
        className="w-full cursor-crosshair rounded border-2 border-gray-300 bg-white"
        onMouseDown={startDrawing}
        onMouseLeave={stopDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={draw}
        onTouchStart={startDrawing}
        ref={canvasRef}
        style={{ touchAction: 'none' }}
      />
      <Button
        disabled={isEmpty}
        onClick={clearSignature}
        size="sm"
        type="button"
        variant="outline"
      >
        Clear Signature
      </Button>
    </div>
  )
}
