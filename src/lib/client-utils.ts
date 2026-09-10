// Helpers client-side pour formater et appeler les API
import { formatMontant, formatMoney, D } from '@/lib/money'

export function fmt(amount: string | number | null | undefined, devise?: string): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const s = String(amount)
  if (devise) return formatMoney(s, devise)
  return formatMontant(s)
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtDateInput(d: string | Date | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}

export async function api<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error ?? 'Erreur API')
  }
  return r.json()
}

export async function downloadPdf(devisId: string, variante: 'client' | 'interne' | 'programme', devisNumero?: string): Promise<void> {
  const url = `/api/pdf/${devisId}?variante=${variante}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du PDF')
  }
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  const filename = devisNumero
    ? `Devis_${devisNumero}_${variante}.pdf`
    : `devis-${devisId}-${variante}.pdf`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

/**
 * Imprime un document (A4 ou A5) via une iframe isolée.
 * Cette méthode :
 * 1. Ne déclenche AUCUN popup-blocker (contrairement à window.open).
 * 2. Fonctionne de façon 100% native dans Tauri v2 (WebView2) et tous navigateurs.
 * 3. Isole complètement le document des overlays/modals Radix (aucun débordement).
 * 4. Calibre la taille @page A4 ou A5 portrait avec marges précises.
 */
export function printDocument(format: 'A4' | 'A5', orientation: 'portrait' | 'landscape' = 'portrait'): void {
  if (typeof window === 'undefined') return

  // Trouver le conteneur imprimable ciblé
  const containers = document.querySelectorAll('.print-only-container')
  const container = containers[containers.length - 1]
  if (!container) {
    console.error('printDocument: aucun conteneur .print-only-container trouvé')
    return
  }

  // Nettoyer toute iframe d'impression précédente
  const oldIframe = document.getElementById('print-document-iframe')
  if (oldIframe) {
    oldIframe.remove()
  }

  // Récupérer toutes les feuilles de style de l'application
  const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
  const stylesHtml = styleElements.map(el => el.outerHTML).join('\n')

  const margin = format === 'A5' ? '5mm 7mm 5mm 7mm' : '8mm 10mm 8mm 10mm'
  const maxWidth = format === 'A5' ? '134mm' : '190mm'
  const baseFontSize = format === 'A5' ? '9pt' : '9.5pt'

  const printOverrideCSS = `
    @page {
      size: ${format} ${orientation};
      margin: ${margin};
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      background: #ffffff !important;
      color: #0f172a !important;
      font-size: ${baseFontSize} !important;
      line-height: 1.35 !important;
      overflow: visible !important;
    }
    body {
      display: flex !important;
      justify-content: center !important;
      align-items: flex-start !important;
    }
    .print-root {
      width: 100% !important;
      max-width: ${maxWidth} !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
      border: none !important;
      box-shadow: none !important;
    }
    .no-print, button { display: none !important; }
    .no-break { page-break-inside: avoid !important; break-inside: avoid !important; }
    h1,h2,h3,h4,h5,h6 { page-break-after: avoid !important; break-after: avoid !important; margin: 0; }
    p, li { orphans: 3; widows: 3; margin: 0; }
    table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; word-wrap: break-word !important; }
    thead { display: table-header-group !important; }
    tfoot { display: table-footer-group !important; }
    tr { page-break-inside: avoid !important; break-inside: avoid !important; }
  `

  const iframe = document.createElement('iframe')
  iframe.id = 'print-document-iframe'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    console.error('printDocument: impossible d\'accéder au document de l\'iframe')
    window.print()
    return
  }

  const contentHtml = container.innerHTML

  doc.open()
  doc.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <base href="${window.location.origin}/">
  <title>Impression ${format}</title>
  ${stylesHtml}
  <style>${printOverrideCSS}</style>
</head>
<body>
  <div class="print-root">${contentHtml}</div>
</body>
</html>`)
  doc.close()

  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    try {
      const win = iframe.contentWindow
      if (!win) return
      win.focus()
      win.print()
    } catch (e) {
      console.warn('printDocument error:', e)
    } finally {
      setTimeout(() => {
        iframe.remove()
      }, 1500)
    }
  }

  // Attendre le chargement des styles et polices
  if (iframe.contentWindow) {
    iframe.contentWindow.onload = () => {
      setTimeout(triggerPrint, 200)
    }
  }
  // Fallback si onload ne se déclenche pas
  setTimeout(triggerPrint, 600)
}

export { D }

