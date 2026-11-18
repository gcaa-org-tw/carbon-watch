/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return [];
  }

  // Parse header
  const headers = parseCSVLine(lines[0].replace(/^\uFEFF/, ''));

  // Parse data rows
  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Parse a number string from CSV (handles $ and commas)
 */
export function parseNumber(value: string): number {
  if (!value || value === '') return 0;
  // Remove $, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function holdingsPeriod(rows: Record<string, string>[]): { 年度: number; 季別: number } {
  const periods = [...new Set(rows.map(row => `${row['年度']}-${row['季別']}`))];
  const [年度, 季別] = (periods[0] ?? '').split('-').map(Number);
  if (periods.length !== 1 || !年度 || !季別) {
    throw new Error(`Holdings must cover exactly one quarter, found: ${periods.join(', ')}`);
  }
  return { 年度, 季別 };
}

export function assertSummaryMatchesHoldings(
  label: string,
  summary: Record<string, string>[],
  holdings: Record<string, string>[]
) {
  const total = new Map<string, number>();
  const emitters = new Map<string, number>();
  holdings.forEach(row => {
    const code = (row['基金代號'] || '').trim();
    total.set(code, (total.get(code) ?? 0) + 1);
    if (String(row['是否排碳大戶']).trim().toUpperCase() === 'TRUE') {
      emitters.set(code, (emitters.get(code) ?? 0) + 1);
    }
  });
  const summaryCodes = summary.map(row => (row['基金代號'] || '').trim()).filter(Boolean);
  const mismatched = summary
    .filter(row => (row['基金代號'] || '').trim())
    .filter(row => {
      const code = row['基金代號']!.trim();
      return (
        parseNumber(row['持股企業數'] ?? '') !== (total.get(code) ?? 0) ||
        parseNumber(row['排碳大戶家數'] ?? '') !== (emitters.get(code) ?? 0)
      );
    })
    .map(row => row['基金代號']!.trim());
  const orphans = [...total.keys()].filter(code => !summaryCodes.includes(code));
  if (mismatched.length > 0 || orphans.length > 0) {
    throw new Error(
      `${label}: fund summary and holdings disagree ` +
        `(count mismatch: ${mismatched.join(', ') || 'none'}; ` +
        `holdings without summary: ${orphans.join(', ') || 'none'})`
    );
  }
}

export function checkFundTabs(csvByTab: ReadonlyMap<string, string>) {
  const read = (tab: string) => parseCSV(csvByTab.get(tab) ?? '');
  const managerHoldings = read('VI. 所有基金與排碳大戶對照');
  const esgHoldings = read('XV. ESG持股明細');
  assertSummaryMatchesHoldings('XII vs VI', read('XII. 基金排碳量資訊'), managerHoldings);
  assertSummaryMatchesHoldings('XIV vs XV', read('XIV. ESG基金summary'), esgHoldings);
  holdingsPeriod([...managerHoldings, ...esgHoldings]);
}
