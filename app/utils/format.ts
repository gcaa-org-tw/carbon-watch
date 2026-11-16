export const zhCollator = new Intl.Collator('zh-Hant-TW-u-co-stroke')

const toNumber = (raw: string | number | null | undefined): number => {
  if (typeof raw === 'number') return raw
  const s = String(raw ?? '').replace(/,/g, '').trim()
  return s === '' ? Number.NaN : Number(s)
}

const UNIT_STEP = 10_000

export const formatApprox = (n: number): string => {
  if (n < UNIT_STEP) return Math.round(n).toLocaleString('zh-TW')
  const tenths = Math.round(n / (UNIT_STEP / 10)) / 10
  if (tenths < 100) return `約${tenths.toFixed(1)}萬`
  const wan = Math.round(n / UNIT_STEP)
  const parts: Array<[number, string]> = [
    [Math.floor(wan / UNIT_STEP ** 2), '兆'],
    [Math.floor(wan / UNIT_STEP) % UNIT_STEP, '億'],
    [wan % UNIT_STEP, '萬'],
  ]
  return `約${parts.filter(([v]) => v > 0).map(([v, unit]) => `${v.toLocaleString('zh-TW')}${unit}`).join('')}`
}

export const formatApproxWithUnit = (n: number, unit: string): string => {
  const text = formatApprox(n)
  const joined = text.startsWith('約') && !/^[A-Za-z]/.test(unit)
  return joined ? `${text}${unit}` : `${text} ${unit}`
}

export const formatEmissions = (raw: string | number | null | undefined): string => {
  const n = toNumber(raw)
  if (!n || Number.isNaN(n)) return '—'
  return `${formatApprox(n)}噸`
}

export const formatTonnes = (raw: string | number | null | undefined): string => {
  if (raw === null || raw === undefined) return '—'
  if (String(raw).trim() === 'NA') return '—'
  const n = toNumber(raw)
  if (Number.isNaN(n)) return '—'
  return formatApprox(n)
}

export const NO_REPORT = 'NA'
export const NOT_DISCLOSED = '—'

export const reportPlaceholder = (raw: string | number | null | undefined, hasReport: boolean): string | undefined => {
  if (!hasReport) return NO_REPORT
  const s = String(raw ?? '').trim()
  if (s === '' || s === 'NA') return NOT_DISCLOSED
  return undefined
}

export const reportCheck = (raw: string | null | undefined, hasReport: boolean, showCross = false): string => {
  if (!hasReport) return NO_REPORT
  if (raw === '✅') return '✓'
  if (showCross && raw === '❌') return '✗'
  return NOT_DISCLOSED
}
