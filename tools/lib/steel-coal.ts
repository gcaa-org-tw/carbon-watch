import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeCompanyName, normalizeUBN } from './normalize.js';

export type YearTonnes = Map<number, number>;

const YEAR_HEADER = /^\d{4}$/;

export function padUBN(raw: string | undefined): string {
  const cleaned = normalizeUBN(raw);
  return cleaned ? cleaned.padStart(8, '0') : '';
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function readRows(path: string): Record<string, string>[] {
  const lines = readFileSync(path, 'utf-8')
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .split('\n')
    .filter(line => line.trim());
  if (lines.length === 0) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

function parseTonnes(value: string | undefined): number {
  const num = parseFloat((value || '').replace(/[,\s]/g, ''));
  return Number.isNaN(num) ? 0 : num;
}

export function loadSteelCoalByUbn(rawDataDir: string): Map<string, YearTonnes> {
  const ubnByName = new Map<string, string>();
  for (const row of readRows(join(rawDataDir, 'VIII. 歷年燃煤數據.csv'))) {
    const name = normalizeCompanyName(row['公司']);
    const ubn = padUBN(row['統編補0'] || row['事業統編']);
    if (name && ubn) ubnByName.set(name, ubn);
  }

  const byUbn = new Map<string, YearTonnes>();
  for (const row of readRows(join(rawDataDir, '鋼鐵業用煤_歷年.csv'))) {
    const name = normalizeCompanyName(row['公司']);
    const ubn = ubnByName.get(name);
    if (!ubn) {
      throw new Error(`鋼鐵業用煤_歷年.csv: no 事業統編 in VIII. 歷年燃煤數據.csv for ${name}`);
    }
    const years: YearTonnes = new Map();
    for (const header of Object.keys(row)) {
      if (YEAR_HEADER.test(header)) years.set(parseInt(header), parseTonnes(row[header]));
    }
    byUbn.set(ubn, years);
  }
  return byUbn;
}
