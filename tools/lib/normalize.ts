// Normalize county names to the topojson convention (台 not 臺) and post-2014
// 桃園市. The topojson at app/assets/tw-counties.json uses 台北/台中/台南/台東;
// any 臺-form upstream values must collapse for map highlighting.
export function normalizeCounty(county: string): string {
  const taSwapped = county.replace(/臺/g, '台');
  if (taSwapped === '桃園縣') return '桃園市';
  if (taSwapped === '宜蘭市') return '宜蘭縣';
  return taSwapped;
}

// SOT UBN cells sometimes carry a leading tab from upstream formatting.
export function normalizeUBN(raw: string | undefined): string {
  return (raw || '').replace(/\t/g, '').trim();
}

// Company-name 異體字 collapse: upstream SOT CSVs (溫室氣體排放, 燃煤) write
// 臺 while hub 排碳大戶表_Data writes 台. Both sides must normalize before join,
// otherwise 5 companies (南紡 台紙 台鹽 台群 湯淺電池) silently drop out.
export function normalizeCompanyName(raw: string | undefined): string {
  return (raw || '').replace(/臺/g, '台').trim();
}

// 曾用名稱 holds former names separated by 、.
export function createCompanyUBNResolver(
  hubRows: Array<Record<string, string>>
): (name: string | undefined) => string | undefined {
  const byName = new Map<string, string>();
  for (const row of hubRows) {
    const ubn = normalizeUBN(row['統一編號']);
    if (!ubn) continue;
    for (const name of [row['公司全稱'], ...(row['曾用名稱'] || '').split('、')]) {
      const key = normalizeCompanyName(name);
      if (key) byName.set(key, ubn.padStart(8, '0'));
    }
  }
  return name => byName.get(normalizeCompanyName(name));
}

// Branch offices (分公司) file factory emissions under their own 統編, so a
// factory row whose 事業統編 is not a tracked company falls back to the
// tracked company whose 公司全名 or 曾用名稱 prefixes its 事業名稱.
export function createFactoryUBNResolver(
  companies: Array<Record<string, unknown>>
): (row: Record<string, string>) => string | undefined {
  const allowedUBNs = new Set<string>();
  const byFullName: Array<[string, string]> = [];
  for (const c of companies) {
    const ubn = String(c['事業統編'] ?? '').trim();
    if (!ubn) continue;
    allowedUBNs.add(ubn);
    for (const raw of [String(c['公司全名'] ?? ''), ...String(c['曾用名稱'] ?? '').split('、')]) {
      const name = normalizeCompanyName(raw);
      if (name) byFullName.push([name, ubn]);
    }
  }
  byFullName.sort((a, b) => b[0].length - a[0].length);

  return (row) => {
    const ubn = normalizeUBN(row['事業統編']);
    if (ubn && allowedUBNs.has(ubn)) return ubn;
    const name = normalizeCompanyName(row['事業名稱']);
    return byFullName.find(([fullName]) => name.startsWith(fullName))?.[1];
  };
}
