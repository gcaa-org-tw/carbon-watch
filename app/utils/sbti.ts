const SBTI_RANK: Record<string, number> = {
  '符合1.5°C目標': 3,
  '遠低於2°C': 2,
  '承諾設定科學基礎目標': 1,
  [String.fromCodePoint(0x274C)]: 0,
}

export const sbtiRank = (raw: unknown): number => {
  const s = String(raw ?? '').trim()
  if (s === '') return -1
  return SBTI_RANK[s] ?? -1
}
