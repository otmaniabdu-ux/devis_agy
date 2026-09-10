/**
 * Conversion de montants en dinars algériens (DZD) en toutes lettres (Français)
 * Conforme aux normes comptables et bancaires algériennes.
 */

export function numberToWords(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return ''
  if (num === 0) return 'zéro'

  const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
  const TEENS = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
  const TENS = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix']

  function convertChunk(val: number): string {
    let res = ''
    const h = Math.floor(val / 100)
    const remainder = val % 100

    if (h > 0) {
      if (h === 1) {
        res += 'cent'
      } else {
        res += `${UNITS[h]} cent${remainder === 0 ? 's' : ''}`
      }
      if (remainder > 0) res += ' '
    }

    if (remainder > 0) {
      if (remainder < 10) {
        res += UNITS[remainder]
      } else if (remainder < 20) {
        res += TEENS[remainder - 10]
      } else if (remainder < 70) {
        const t = Math.floor(remainder / 10)
        const u = remainder % 10
        if (u === 1) {
          res += `${TENS[t]} et un`
        } else if (u > 0) {
          res += `${TENS[t]}-${UNITS[u]}`
        } else {
          res += TENS[t]
        }
      } else if (remainder < 80) {
        const u = remainder - 70
        if (u === 1) {
          res += 'soixante et onze'
        } else {
          res += `soixante-${TEENS[u]}`
        }
      } else if (remainder < 90) {
        const u = remainder - 80
        if (u === 0) {
          res += 'quatre-vingts'
        } else {
          res += `quatre-vingt-${UNITS[u]}`
        }
      } else {
        const u = remainder - 90
        res += `quatre-vingt-${TEENS[u]}`
      }
    }

    return res.trim()
  }

  const intPart = Math.floor(Math.abs(num))

  const SCALES = [
    { value: 1000000000, singular: 'milliard', plural: 'milliards' },
    { value: 1000000, singular: 'million', plural: 'millions' },
    { value: 1000, singular: 'mille', plural: 'mille' },
    { value: 1, singular: '', plural: '' },
  ]

  let words = ''
  let remaining = intPart

  if (remaining === 0) {
    words = 'zéro'
  } else {
    const parts: string[] = []
    for (const scale of SCALES) {
      if (remaining >= scale.value) {
        const chunk = Math.floor(remaining / scale.value)
        remaining %= scale.value

        if (scale.value === 1000) {
          if (chunk === 1) {
            parts.push('mille')
          } else {
            parts.push(`${convertChunk(chunk)} mille`)
          }
        } else if (scale.value > 1000) {
          const chunkStr = convertChunk(chunk)
          const scaleName = chunk > 1 ? scale.plural : scale.singular
          parts.push(`${chunkStr} ${scaleName}`)
        } else {
          parts.push(convertChunk(chunk))
        }
      }
    }
    words = parts.filter(Boolean).join(' ')
  }

  return words
}

/**
 * Retourne le montant formulé en toutes lettres en Dinars Algériens.
 * Ex: "Quatre cent cinquante mille dinars algériens"
 */
export function montantEnLettresDzd(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return ''

  const intPart = Math.floor(Math.abs(num))
  const decPart = Math.round((Math.abs(num) - intPart) * 100)

  const intWords = numberToWords(intPart)
  const currency = intPart > 1 ? 'dinars algériens' : 'dinar algérien'

  let result = `${intWords} ${currency}`
  if (decPart > 0) {
    const decWords = numberToWords(decPart)
    const centimes = decPart > 1 ? 'centimes' : 'centime'
    result += ` et ${decWords} ${centimes}`
  }

  return result.charAt(0).toUpperCase() + result.slice(1)
}
