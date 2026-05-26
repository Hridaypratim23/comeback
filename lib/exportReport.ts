import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

const PIXEL_RATIO = 2.5

async function capture(el: HTMLElement): Promise<string> {
  return toPng(el, {
    pixelRatio: PIXEL_RATIO,
    cacheBust: true,
    backgroundColor: '#070709',
    // Give fonts time to be available
    fontEmbedCSS: '',
  })
}

export async function shareAsImage(el: HTMLElement): Promise<void> {
  const dataUrl = await capture(el)

  // Native share (iOS / Android) — lets user pick WhatsApp, Messages, etc.
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'comeback-progress.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Comeback Progress' })
        return
      }
    } catch {
      // fall through to download
    }
  }

  // Desktop fallback: trigger download
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'comeback-progress.png'
  a.click()
}

export async function saveAsPDF(el: HTMLElement): Promise<void> {
  const dataUrl = await capture(el)

  const img = new Image()
  img.src = dataUrl
  await new Promise<void>(res => { img.onload = () => res() })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()   // 210mm
  const H = pdf.internal.pageSize.getHeight()  // 297mm
  const margin = 10
  const contentW = W - margin * 2
  const contentH = H - margin * 2

  // Scale the image to fit the page width, then split across pages
  const scale  = contentW / img.width
  const totalH = img.height * scale
  const pages  = Math.ceil(totalH / contentH)

  for (let i = 0; i < pages; i++) {
    if (i > 0) pdf.addPage()
    // Shift the image up so the correct slice is visible each page
    pdf.addImage(dataUrl, 'PNG', margin, margin - i * contentH, contentW, totalH)
  }

  pdf.save('comeback-progress.pdf')
}
