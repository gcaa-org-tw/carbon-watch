/**
 * Top-10 Company Region Emission Transformer
 *
 * Builds app/assets/data/top-company-region-emissions.json — the data driving
 * the home page "前十大碳排企業縣市分布" map and cards.
 *
 * ## Inputs
 *
 * - `app/assets/data/company-list.json`  — companies, sorted by latest emission,
 *   with 公司全名 + 事業統編 already attached and 排放量 overridden from the SOT.
 * - `raw-data/工廠縣市排放_歷年.csv`  — factory-level SOT (本年度 113 = 2024).
 *   Used for per-county distribution.
 *
 * Sourcing both totals and the per-county split from the same SOT keeps the
 * home cards aligned with the company detail page (year, scope, value).
 *
 * Previously this script consumed `IV. 企業縣市排放絕對值（公式）.csv`, a 2023
 * Sheet-B snapshot that drifted from the new 2024 SOT.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './lib/logger.js';
import { normalizeCounty, normalizeUBN } from './lib/normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RAW_DATA_DIR = join(__dirname, '..', 'raw-data');
const ASSETS_DATA_DIR = join(__dirname, '..', 'app', 'assets', 'data');

const FACTORY_SOT_YEAR = '113'; // ROC = 2024

interface CompanyRegionEmission {
  公司全名: string;
  公司: string;
  全台排放量: number;
  全台佔比: number;
  縣市排放: Record<string, number>;
  排放縣市: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
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

function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    data.push(row);
  }
  return data;
}

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function transformTopCompanyRegionData() {
  const logger = new Logger();

  try {
    logger.info('Starting top company region data transformation');

    // 1) Load company-list.json (already sorted by 排放量 2024 inside top-10).
    const companyListPath = join(ASSETS_DATA_DIR, 'company-list.json');
    const companies: Array<Record<string, unknown>> = JSON.parse(
      readFileSync(companyListPath, 'utf-8')
    );
    logger.info(`Loaded ${companies.length} companies from company-list.json`);

    // 2) Compute Taiwan-wide total from the same 排放量 field that drives 年碳排.
    const totalTaiwanEmissions = companies.reduce((sum, c) => {
      return sum + parseAmount((c['溫室氣體排放量（公噸二氧化碳當量）'] as string) || '');
    }, 0);
    logger.info(`Total Taiwan emissions (2024 SOT): ${totalTaiwanEmissions.toLocaleString()} tonnes`);

    // 3) Pick top 10 by 排放量 desc.
    const top10 = [...companies]
      .map(c => ({
        ...c,
        _amount: parseAmount((c['溫室氣體排放量（公噸二氧化碳當量）'] as string) || ''),
      }))
      .filter(c => c._amount > 0)
      .sort((a, b) => b._amount - a._amount)
      .slice(0, 10);
    logger.info(`Top 10 by 2024 排放量:`);
    top10.forEach((c, i) => {
      logger.info(`  ${i + 1}. ${c['公司']} — ${c._amount.toLocaleString()}`);
    });

    // 4) Load factory SOT and build (UBN → county → emission) for year 113.
    //    Restricted to UBNs in our 287-list so the per-county breakdown lines
    //    up with the region-emission-list and detail-page county shares.
    const allowedUBNs = new Set<string>();
    for (const c of companies) {
      const u = ((c['事業統編'] as string) || '').trim();
      if (u) allowedUBNs.add(u);
    }

    const factoryPath = join(RAW_DATA_DIR, '工廠縣市排放_歷年.csv');
    const factoryRows = parseCSV(readFileSync(factoryPath, 'utf-8'));
    const byUBN = new Map<string, Map<string, number>>();
    for (const row of factoryRows) {
      if (row['年度'] !== FACTORY_SOT_YEAR) continue;
      const ubn = normalizeUBN(row['事業統編']);
      if (!ubn || !allowedUBNs.has(ubn)) continue;
      const county = normalizeCounty((row['縣市別'] || '').trim());
      const amt = parseAmount(row['合計排放量(公噸CO2e)']);
      if (!county || amt <= 0) continue;
      if (!byUBN.has(ubn)) byUBN.set(ubn, new Map());
      const m = byUBN.get(ubn)!;
      m.set(county, (m.get(county) || 0) + amt);
    }
    logger.info(`Loaded factory SOT year ${FACTORY_SOT_YEAR}: ${byUBN.size} 事業統編`);

    // 5) Build the result.
    const result: CompanyRegionEmission[] = [];
    for (const c of top10) {
      const ubn = ((c['事業統編'] as string) || '').trim();
      const ubnMap = ubn ? byUBN.get(ubn) : undefined;

      const 縣市排放: Record<string, number> = {};
      const 排放縣市: string[] = [];
      if (ubnMap) {
        for (const [county, amt] of ubnMap.entries()) {
          縣市排放[county] = Math.round(amt);
          排放縣市.push(county);
        }
      } else {
        logger.info(`  ${c['公司']}: no 事業統編 match in factory SOT — counties empty`);
      }

      const total = c._amount;
      const percentage = totalTaiwanEmissions > 0
        ? Math.round((total / totalTaiwanEmissions) * 1000) / 10
        : 0;

      result.push({
        公司全名: (c['公司全名'] as string) || (c['公司'] as string),
        公司: (c['公司'] as string),
        全台排放量: Math.round(total),
        全台佔比: percentage,
        縣市排放,
        排放縣市,
      });
    }

    // 6) Write
    mkdirSync(ASSETS_DATA_DIR, { recursive: true });
    const outputPath = join(ASSETS_DATA_DIR, 'top-company-region-emissions.json');
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    logger.success(`Saved to: top-company-region-emissions.json`);
    logger.logDuration();
  } catch (error) {
    logger.error('Fatal error during transformation', error);
    process.exit(1);
  }
}

transformTopCompanyRegionData();
