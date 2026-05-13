/**
 * Region Map Data Transformer
 *
 * Outputs `app/assets/data/region-emission-list.json` — the data driving the
 * home page 排碳縣市分佈 section (RegionEmissionSection.vue).
 *
 * ## Source
 *
 * `raw-data/工廠縣市排放_歷年.csv` filtered to ROC 113 / 2024, **scoped to the
 * 287 UBNs in `app/assets/data/company-list.json`**. The whitelist matters
 * because the factory SOT also lists 台電 / IPP plants (電力供應業) and small
 * non-listed factories, neither of which is part of the site's "排碳大戶"
 * narrative. Scoping to our 287 keeps the home page county totals + 企業數
 * consistent with the per-company 縣市佔比 on the detail page.
 *
 * Previously this script consumed `IV. 企業縣市排放絕對值（公式）.csv`, a 2023
 * Sheet-B snapshot that drifted from the new SOT.
 *
 * ## Output shape
 *
 * ```typescript
 * interface RegionEmission {
 *   縣市: string;          // matches topojson properties.name (uses 台, not 臺)
 *   總排放量: number;       // tonnes CO2e, year 113
 *   總排放量佔比: number;   // % of total Taiwan 排碳大戶 emissions
 *   企業數: number;         // distinct 事業統編 with a factory in this county
 * }
 * ```
 *
 * Sorted by 總排放量 desc.
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
const OUTPUT_DIR = ASSETS_DATA_DIR;

const FACTORY_SOT_YEAR = '113';

interface RegionEmission {
  縣市: string;
  總排放量: number;
  總排放量佔比: number;
  企業數: number;
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

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.replace(/\r/g, '').split('\n').filter(l => l.trim());
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

async function transformRegionMapData() {
  const logger = new Logger();

  try {
    logger.info('Starting region map data transformation');
    logger.info('='.repeat(60));

    // Whitelist of UBNs we surface as 排碳大戶 (287 in company-list).
    const companyListPath = join(ASSETS_DATA_DIR, 'company-list.json');
    const companies: Array<Record<string, unknown>> = JSON.parse(
      readFileSync(companyListPath, 'utf-8')
    );
    const allowedUBNs = new Set<string>();
    for (const c of companies) {
      const u = ((c['事業統編'] as string) || '').trim();
      if (u) allowedUBNs.add(u);
    }
    logger.info(`Whitelist size: ${allowedUBNs.size} UBNs from company-list.json`);

    const csvPath = join(RAW_DATA_DIR, '工廠縣市排放_歷年.csv');
    logger.info(`Reading factory SOT from: ${csvPath}`);
    const rows = parseCSV(readFileSync(csvPath, 'utf-8'));
    logger.info(`Parsed ${rows.length} factory rows`);

    // Aggregate per-county totals + distinct UBN count for the chosen year.
    const totals = new Map<string, number>();
    const ubnsByCounty = new Map<string, Set<string>>();
    let yearRowCount = 0;

    for (const row of rows) {
      if (row['年度'] !== FACTORY_SOT_YEAR) continue;
      yearRowCount++;
      const ubn = normalizeUBN(row['事業統編']);
      if (!ubn || !allowedUBNs.has(ubn)) continue;
      const county = normalizeCounty((row['縣市別'] || '').trim());
      const amt = parseAmount(row['合計排放量(公噸CO2e)']);
      if (!county || amt <= 0) continue;

      totals.set(county, (totals.get(county) || 0) + amt);
      if (!ubnsByCounty.has(county)) ubnsByCounty.set(county, new Set());
      ubnsByCounty.get(county)!.add(ubn);
    }

    logger.info(`Year ${FACTORY_SOT_YEAR} rows: ${yearRowCount}`);
    logger.info(`Distinct counties: ${totals.size}`);

    const totalEmissions = Array.from(totals.values()).reduce((a, b) => a + b, 0);
    logger.info(`Total emissions (sum of counties): ${totalEmissions.toLocaleString()} tonnes CO2e`);

    const regionList: RegionEmission[] = Array.from(totals.entries())
      .map(([county, amt]) => ({
        縣市: county,
        總排放量: Math.round(amt),
        總排放量佔比: totalEmissions > 0
          ? Math.round((amt / totalEmissions) * 10000) / 100
          : 0,
        企業數: ubnsByCounty.get(county)?.size ?? 0,
      }))
      .sort((a, b) => b.總排放量 - a.總排放量);

    mkdirSync(OUTPUT_DIR, { recursive: true });
    const outputPath = join(OUTPUT_DIR, 'region-emission-list.json');
    writeFileSync(outputPath, JSON.stringify(regionList, null, 2), 'utf-8');
    logger.success(`Saved region emission list to: region-emission-list.json`);

    logger.info('='.repeat(60));
    logger.info('Top 5:');
    regionList.slice(0, 5).forEach(r => {
      logger.info(
        `  ${r.縣市}: ${r.總排放量.toLocaleString()} tCO2e, ${r.總排放量佔比}%, ${r.企業數} 家`
      );
    });
    logger.logDuration();
    logger.info('='.repeat(60));
  } catch (error) {
    logger.error('Fatal error during data transformation', error);
    process.exit(1);
  }
}

transformRegionMapData();
