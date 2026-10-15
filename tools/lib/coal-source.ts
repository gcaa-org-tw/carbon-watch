import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeCompanyName, normalizeCounty, normalizeUBN } from './normalize.js';

export type YearTonnes = Map<number, number>;

const YEAR_HEADER = /^\d{4}$/;
const LAST_COMPLETE_YEAR = 2025;

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

function yearTonnes(row: Record<string, string>): YearTonnes {
  const years: YearTonnes = new Map();
  for (const header of Object.keys(row)) {
    if (!YEAR_HEADER.test(header)) continue;
    const year = parseInt(header);
    if (year <= LAST_COMPLETE_YEAR) years.set(year, parseTonnes(row[header]));
  }
  return years;
}

function loadSteelCoalByCompany(rawDataDir: string): Map<string, YearTonnes> {
  const byCompany = new Map<string, YearTonnes>();
  for (const row of readRows(join(rawDataDir, '鋼鐵業用煤_歷年.csv'))) {
    const name = normalizeCompanyName(row['公司']);
    if (name) byCompany.set(name, yearTonnes(row));
  }
  return byCompany;
}

export function loadCoalByCompany(rawDataDir: string): Map<string, YearTonnes> {
  const steelByCompany = loadSteelCoalByCompany(rawDataDir);
  const byCompany = new Map<string, YearTonnes>();
  for (const row of readRows(join(rawDataDir, '用煤者_公司.csv'))) {
    const name = normalizeCompanyName(row['公司']);
    if (!name || !row['產業別認定'] || steelByCompany.has(name)) continue;
    byCompany.set(name, yearTonnes(row));
  }
  for (const [name, years] of steelByCompany) byCompany.set(name, years);
  return byCompany;
}

export interface CoalFactory {
  管制編號: string;
  廠名: string;
  公司全名: string;
  業別: string;
  縣市: string;
  years: YearTonnes;
}

export interface LocatedCoalFactory extends CoalFactory {
  經度: number;
  緯度: number;
  座標來源: string;
}

function loadIndustryByCompany(rawDataDir: string): Map<string, string> {
  const byCompany = new Map<string, string>();
  for (const row of readRows(join(rawDataDir, '用煤者產業對照.csv'))) {
    const name = normalizeCompanyName(row['公司']);
    if (name) byCompany.set(name, row['業別（經查詢認定）'].trim());
  }
  return byCompany;
}

export function loadCoalFactories(rawDataDir: string): {
  located: LocatedCoalFactory[];
  unlocated: CoalFactory[];
} {
  const steelByCompany = loadSteelCoalByCompany(rawDataDir);
  const industryByCompany = loadIndustryByCompany(rawDataDir);
  const factories: CoalFactory[] = [];

  const industryOf = (company: string): string => {
    const industry = industryByCompany.get(normalizeCompanyName(company));
    if (!industry) throw new Error(`用煤者產業對照.csv: no 業別 for ${company}`);
    return industry;
  };

  for (const row of readRows(join(rawDataDir, '用煤者_廠.csv'))) {
    const cno = row['cno'].trim();
    const company = row['公司'].trim();
    if (!cno || !company || company.startsWith('#') || steelByCompany.has(normalizeCompanyName(company))) continue;
    factories.push({
      管制編號: cno,
      廠名: row['facname'].trim(),
      公司全名: company,
      業別: industryOf(company),
      縣市: normalizeCounty(row['county'].trim()),
      years: yearTonnes(row),
    });
  }

  for (const row of readRows(join(rawDataDir, '鋼鐵業工廠對照.csv'))) {
    const company = row['公司'].trim();
    const years = steelByCompany.get(normalizeCompanyName(company));
    if (!years) {
      throw new Error(`鋼鐵業用煤_歷年.csv: no coal data for ${company}`);
    }
    factories.push({
      管制編號: row['管制編號'].trim(),
      廠名: row['廠名'].trim(),
      公司全名: company,
      業別: industryOf(company),
      縣市: normalizeCounty(row['縣市'].trim()),
      years,
    });
  }

  const byCno = new Map(factories.map(f => [f.管制編號, f]));
  const located: LocatedCoalFactory[] = [];
  const locatedCnos = new Set<string>();
  for (const row of readRows(join(rawDataDir, '燃煤工廠座標.csv'))) {
    const cno = row['管制編號'].trim();
    const factory = byCno.get(cno);
    const 經度 = parseFloat(row['wgs84經度']);
    const 緯度 = parseFloat(row['wgs84緯度']);
    if (!factory || Number.isNaN(經度) || Number.isNaN(緯度)) continue;
    located.push({ ...factory, 經度, 緯度, 座標來源: row['座標來源'].trim() });
    locatedCnos.add(cno);
  }
  return { located, unlocated: factories.filter(f => !locatedCnos.has(f.管制編號)) };
}
