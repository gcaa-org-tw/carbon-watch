export const zhCollator = new Intl.Collator('zh-Hant-TW-u-co-stroke')

export const formatTonnes = (raw: string | number | null | undefined): string => {
  if (raw === null || raw === undefined) return '—'
  const s = String(raw).trim()
  if (s === '' || s === 'NA') return '—'
  const n = typeof raw === 'number' ? raw : Number(s.replace(/,/g, ''))
  if (Number.isNaN(n)) return '—'
  return Math.round(n).toLocaleString('zh-TW')
}
