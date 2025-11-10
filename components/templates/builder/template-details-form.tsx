'use client'

import { ImageIcon, PaletteIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { COLOR_PALETTES, DEFAULT_BRANDING, isHexColor } from './constants'
import type { BrandingState, PaletteOption } from './types'

export type TemplateDetailsFormProps = {
  branding: BrandingState
  description: string
  locale: string
  templateName: string
  onBrandingChange: (patch: Partial<BrandingState>) => void
  onDescriptionChange: (value: string) => void
  onLocaleChange: (value: string) => void
  onPaletteApply: (palette: PaletteOption) => void
  onTemplateNameChange: (value: string) => void
}

export function TemplateDetailsForm({
  branding,
  description,
  locale,
  templateName,
  onBrandingChange,
  onDescriptionChange,
  onLocaleChange,
  onPaletteApply,
  onTemplateNameChange,
}: TemplateDetailsFormProps) {
  const trimmedPrimaryColor = branding.primaryColor.trim()
  const trimmedAccentColor = branding.accentColor.trim()
  const primaryColorInvalid =
    trimmedPrimaryColor !== '' && !isHexColor(trimmedPrimaryColor)
  const accentColorInvalid =
    trimmedAccentColor !== '' && !isHexColor(trimmedAccentColor)

  const primarySwatch =
    !primaryColorInvalid && trimmedPrimaryColor !== ''
      ? trimmedPrimaryColor
      : DEFAULT_BRANDING.primaryColor
  const accentSwatch =
    !accentColorInvalid && trimmedAccentColor !== ''
      ? trimmedAccentColor
      : DEFAULT_BRANDING.accentColor

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template details</CardTitle>
        <CardDescription>
          These settings help organize templates across studios and locales.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="template-name">Template name</Label>
          <Input
            id="template-name"
            onChange={(event) => onTemplateNameChange(event.target.value)}
            placeholder="Informed Consent"
            required
            value={templateName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="template-description">Description</Label>
          <Textarea
            id="template-description"
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Internal description. Not visible to participants."
            rows={3}
            value={description}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="template-locale">Locale</Label>
          <Select onValueChange={onLocaleChange} value={locale}>
            <SelectTrigger className="w-48" id="template-locale">
              <SelectValue placeholder="Select locale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="it-IT">Italian (Italy)</SelectItem>
              <SelectItem value="en-US">English (United States)</SelectItem>
              <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
              <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
              <SelectItem value="fr-FR">French (France)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label
            className="flex items-center gap-2"
            htmlFor="template-logo-url"
          >
            <ImageIcon className="size-4 text-muted-foreground" />
            <span>Logo URL</span>
          </Label>
          <Input
            id="template-logo-url"
            inputMode="url"
            onChange={(event) =>
              onBrandingChange({ logoUrl: event.target.value })
            }
            placeholder="https://cdn.example.com/logo.png"
            type="url"
            value={branding.logoUrl}
          />
          <p className="text-muted-foreground text-xs">
            Optional. Appears on generated PDFs and client views.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              className="flex items-center gap-2"
              htmlFor="template-primary-color"
            >
              <PaletteIcon className="size-4 text-muted-foreground" />
              <span>Primary color</span>
            </Label>
            <div className="flex items-center gap-3">
              <span
                className="h-9 w-9 rounded-md border"
                style={{ backgroundColor: primarySwatch }}
              />
              <Input
                id="template-primary-color"
                maxLength={7}
                onChange={(event) =>
                  onBrandingChange({ primaryColor: event.target.value })
                }
                placeholder="#2563eb"
                value={branding.primaryColor}
              />
            </div>
            {primaryColorInvalid ? (
              <p className="text-destructive text-xs">
                Use a hex value like #2563eb.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label
              className="flex items-center gap-2"
              htmlFor="template-accent-color"
            >
              <PaletteIcon className="size-4 text-muted-foreground" />
              <span>Accent color</span>
            </Label>
            <div className="flex items-center gap-3">
              <span
                className="h-9 w-9 rounded-md border"
                style={{ backgroundColor: accentSwatch }}
              />
              <Input
                id="template-accent-color"
                maxLength={7}
                onChange={(event) =>
                  onBrandingChange({ accentColor: event.target.value })
                }
                placeholder="#9333ea"
                value={branding.accentColor}
              />
            </div>
            {accentColorInvalid ? (
              <p className="text-destructive text-xs">
                Use a hex value like #9333ea.
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            Quick palettes
          </span>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTES.map((palette) => (
              <Button
                className="flex h-auto min-w-[140px] flex-col gap-1 px-3 py-2 text-left"
                key={palette.name}
                onClick={() => onPaletteApply(palette)}
                size="sm"
                type="button"
                variant="outline"
              >
                <span className="font-medium text-sm">{palette.name}</span>
                <span className="text-muted-foreground text-xs">
                  {palette.primary} / {palette.accent}
                </span>
                <span className="flex h-1 w-full overflow-hidden rounded-full">
                  <span
                    className="h-full w-1/2"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <span
                    className="h-full w-1/2"
                    style={{ backgroundColor: palette.accent }}
                  />
                </span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
