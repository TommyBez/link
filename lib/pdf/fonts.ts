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
        src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50ujIw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50ujIw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf',
        fontWeight: 500,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50ujIw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf',
        fontWeight: 600,
      },
    ],
  })

  fontsRegistered = true
}
