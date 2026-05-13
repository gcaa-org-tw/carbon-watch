// Normalize county names to the topojson convention (台 not 臺) and post-2014
// 桃園市. The topojson at app/assets/tw-counties.json uses 台北/台中/台南/台東;
// any 臺-form upstream values must collapse for map highlighting.
export function normalizeCounty(county: string): string {
  const taSwapped = county.replace(/臺/g, '台');
  return taSwapped === '桃園縣' ? '桃園市' : taSwapped;
}

// SOT UBN cells sometimes carry a leading tab from upstream formatting.
export function normalizeUBN(raw: string | undefined): string {
  return (raw || '').replace(/\t/g, '').trim();
}
