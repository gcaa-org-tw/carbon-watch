// Line-break segmentation for Chinese table headers.
//
// Chinese has a break opportunity between every character, so a header that is
// one character wider than its column orphans its last glyph onto a line of its
// own (e.g. 範疇三減量規 / 劃). The fix is to forbid breaking by default
// (`word-break: keep-all`) and re-introduce break opportunities ONLY at the
// phrase boundaries listed here, by joining the phrases with a zero-width space
// (U+200B). The header then wraps only between words — never inside one like
// 排放 / 燃煤 / 再生能源 — and `text-wrap: balance` evens out the line lengths.
//
// A header absent from this map carries no break opportunity, so it stays on a
// single line (this is what keeps short headers like 企業名稱 from wrapping).
const ZWSP = String.fromCharCode(0x200b)

const HEADER_SEGMENTS: Record<string, string[]> = {
  // 基金總覽頁
  使用燃煤家數: ['使用燃煤', '家數'],
  '總市值（百萬新台幣）': ['總市值', '（百萬新台幣）'],
  排碳大戶家數: ['排碳大戶', '家數'],
  排碳大戶佔比: ['排碳大戶', '佔比'],
  排碳大戶總碳排量: ['排碳大戶', '總碳排量'],
  // 企業表（專業版／基金持股頁共用同一份程式）
  '溫室氣體排放量（公噸二氧化碳當量）': ['溫室氣體', '排放量', '（公噸二氧化碳當量）'],
  淨零目標年: ['淨零', '目標年'],
  '2030 年減量目標設定': ['2030 年', '減量', '目標設定'],
  '2030 年溫室氣體絕對減量目標': ['2030 年', '溫室氣體', '絕對減量', '目標'],
  '2030 年再生能源使用率目標': ['2030 年', '再生能源', '使用率', '目標'],
  '2030 年能源效率進步目標': ['2030 年', '能源效率', '進步目標'],
  去年再生能源使用率: ['去年', '再生能源', '使用率'],
  近三年能效進步率: ['近三年', '能效', '進步率'],
  範疇三減量規劃: ['範疇三', '減量', '規劃'],
  有具體減量策略: ['有具體', '減量策略'],
  範疇三揭露: ['範疇三', '揭露'],
  能源密集度變化率: ['能源', '密集度', '變化率'],
  節能目標設定: ['節能', '目標設定'],
  再生能源使用率: ['再生能源', '使用率'],
  再生能源設置容量: ['再生能源', '設置容量'],
  是否完成用電大戶再生能源設置義務: ['是否完成', '用電大戶', '再生能源', '設置義務'],
  中期再生能源目標設定: ['中期', '再生能源', '目標設定'],
  '燃煤使用量（公噸）': ['燃煤', '使用量', '（公噸）'],
}

// Returns the header label with zero-width spaces inserted at its phrase
// boundaries. Pair with `break-keep text-balance` on the rendering element.
export function segmentHeader(label: string): string {
  const phrases = HEADER_SEGMENTS[label]
  return phrases ? phrases.join(ZWSP) : label
}
