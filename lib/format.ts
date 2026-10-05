const PERSIAN = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC = '٠١٢٣٤٥٦٧٨٩'

export function normalizeNumberInput(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d)))
    .replace(/[,٬\s]/g, '')
    .replace(/٫/g, '.')
}

export function nf(n: number | null | undefined, digits = 2): string {
  if (n == null) return '—'
  if (!Number.isFinite(n)) return '∞'
  return n.toLocaleString('fa-IR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function toman(n: number): string {
  return Math.round(n).toLocaleString('fa-IR')
}
