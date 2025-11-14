import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

export function ensurePdfFonts(): void {
  if (fontsRegistered) {
    return
  }

  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://github.com/google/fonts/raw/main/ofl/inter/Inter-Medium.ttf',
        fontWeight: 500,
      },
      {
        src: 'https://github.com/google/fonts/raw/main/ofl/inter/Inter-SemiBold.ttf',
        fontWeight: 600,
      },
    ],
  })

  fontsRegistered = true
}
