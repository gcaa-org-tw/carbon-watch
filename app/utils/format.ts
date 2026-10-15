export const zhCollator = new Intl.Collator('zh-Hant-TW-u-co-stroke')

export const formatEmissions = (raw: string | number | null | undefined): string => {
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/,/g, ''))
  if (!n || Number.isNaN(n)) return '—'
  if (n >= 1_000_000) return `${Math.round(n / 10000).toLocaleString('zh-TW')}萬噸`
  if (n >= 10_000) return `${(n / 10000).toFixed(1)}萬噸`
  return `${Math.round(n).toLocaleString('zh-TW')}噸`
}

export const formatTonnes = (raw: string | number | null | undefined): string => {
  if (raw === null || raw === undefined) return '—'
  const s = String(raw).trim()
  if (s === '' || s === 'NA') return '—'
  const n = typeof raw === 'number' ? raw : Number(s.replace(/,/g, ''))
  if (Number.isNaN(n)) return '—'
  return Math.round(n).toLocaleString('zh-TW')
}

export const NO_REPORT = 'NA'
export const NOT_DISCLOSED = '—'

export const reportPlaceholder = (raw: string | number | null | undefined, hasReport: boolean): string | undefined => {
  if (!hasReport) return NO_REPORT
  const s = String(raw ?? '').trim()
  if (s === '' || s === 'NA') return NOT_DISCLOSED
  return undefined
}

export const reportCheck = (raw: string | null | undefined, hasReport: boolean): string => {
  if (!hasReport) return NO_REPORT
  if (raw === '✅') return '✓'
  if (raw === '❌') return '✗'
  return NOT_DISCLOSED
}
