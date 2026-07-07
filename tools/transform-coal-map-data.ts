/**
 * Coal Map Data Transformer
 *
 * Reads raw CSV from raw-data/XVI. 燃煤工廠地圖.csv (98 coal-burning factories
 * of 排碳大戶 companies, with WGS84 coordinates) and outputs the dataset for
 * the /coal-map page.
 *
 * ## Usage
 *
 * ```bash
 * npm run transform-coal-map-data
 * ```
 *
 * ## Input
 *
 * - **Source**: `raw-data/XVI. 燃煤工廠地圖.csv`
 *   Columns: 管制編號, 廠名, 公司全名, 事業統編, 業別, 縣市, wgs84經度, wgs84緯度,
 *   座標來源, 用煤量2020..用煤量2025
 * - **Join**: `raw-data/排碳大戶表_Data.csv` — 統一編號 → 公司簡稱 (company page slug)
 *
 * ## Output
 *
 * ### Coal Map (`app/assets/data/coal-map.json`)
 *
 * ```typescript
 * {
 *   meta: { 資料年份, 廠數, 公司數, 用煤量2024合計, 業別排序 },
 *   factories: Array<{
 *     管制編號, 廠名, 公司全名, 事業統編, 公司簡稱, 業別, 縣市,
 *     經度, 緯度, 座標來源, 用煤量2024,
 *     歷年用煤: Array<{ year, value }>   // >0 entries only
 *   }>
 * }
 * ```
 *
 * 事業統編 is zero-padded to 8 digits on both sides of the hub join — Sheets
 * numeric cells drop leading zeros (e.g. 亞洲水泥 03244509 → 3244509).
 * Rows whose UBN is not in the hub are dropped (scope = 排碳大戶 287): the
 * coal sheet flags group affiliates that hold their own non-hub UBNs.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { normalizeCounty, normalizeUBN } from './lib/normalize.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './lib/logger.js';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const RAW_DATA_DIR = join(__dirname, '..', 'raw-data');
const OUTPUT_DIR = join(__dirname, '..', 'app', 'assets', 'data');

/**
 * Parse a single CSV line, handling quoted fields
 */
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

/**
 * Parse CSV string to array of objects
 */
function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.replace(/\r/g, '').split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);

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
 * Parse a number string from CSV (handles commas and whitespace)
 */
function parseNumber(value: string): number | undefined {
  if (!value || value === '') return undefined;
  const cleaned = value.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

/**
 * Zero-pad a UBN to 8 digits (Sheets numeric cells drop leading zeros)
 */
function padUBN(raw: string | undefined): string {
  const cleaned = normalizeUBN(raw);
  if (!cleaned) return '';
  return cleaned.padStart(8, '0');
}

interface CoalMapFactory {
  管制編號: string;
  廠名: string;
  公司全名: string;
  事業統編: string;
  公司簡稱: string;
  業別: string;
  縣市: string;
  經度: number;
  緯度: number;
  座標來源: string;
  用煤量2024: number;
  歷年用煤: Array<{ year: number; value: number }>;
}

/**
 * Main transformation function
 */
async function transformCoalMapData() {
  const logger = new Logger();

  try {
    logger.info('Starting coal map data transformation');

    // 1. Load factory CSV
    const csvPath = join(RAW_DATA_DIR, 'XVI. 燃煤工廠地圖.csv');
    logger.info(`Reading data from: ${csvPath}`);
    const rawData = parseCSV(readFileSync(csvPath, 'utf-8'));
    logger.info(`Parsed ${rawData.length} factory records`);

    // 2. Load hub CSV for 統一編號 → 公司簡稱
    const hubPath = join(RAW_DATA_DIR, '排碳大戶表_Data.csv');
    const hubData = parseCSV(readFileSync(hubPath, 'utf-8'));
    const shortNameByUBN = new Map<string, string>();
    for (const row of hubData) {
      const ubn = padUBN(row['統一編號']);
      const shortName = (row['公司簡稱'] || '').trim();
      if (ubn && shortName) {
        shortNameByUBN.set(ubn, shortName);
      }
    }
    logger.info(`Hub lookup ready: ${shortNameByUBN.size} companies`);

    // 3. Transform factories
    const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
    const factories: CoalMapFactory[] = [];
    const joinMisses: string[] = [];

    for (const row of rawData) {
      const cno = (row['管制編號'] || '').trim();
      if (!cno) continue;

      // Scope gate: the page covers 排碳大戶 (hub 287) only. The coal sheet's
      // 屬排碳大戶 mark is broader — it flags group affiliates (錦州科技/長輝
      // 事業/州霖) whose own UBNs are not in the hub. Drop those rows here.
      const ubn = padUBN(row['事業統編']);
      const shortName = shortNameByUBN.get(ubn) ?? null;
      if (!shortName) {
        joinMisses.push(`${row['公司全名']} (${ubn})`);
        continue;
      }

      const 歷年用煤: Array<{ year: number; value: number }> = [];
      for (const year of YEARS) {
        const value = parseNumber(row[`用煤量${year}`]);
        if (value !== undefined && value > 0) {
          歷年用煤.push({ year, value });
        }
      }

      const lon = parseNumber(row['wgs84經度']);
      const lat = parseNumber(row['wgs84緯度']);
      if (lon === undefined || lat === undefined) {
        logger.info(`Skipping ${cno} ${row['廠名']}: missing coordinates`);
        continue;
      }

      factories.push({
        管制編號: cno,
        廠名: (row['廠名'] || '').trim(),
        公司全名: (row['公司全名'] || '').trim(),
        事業統編: ubn,
        公司簡稱: shortName,
        業別: (row['業別'] || '').trim(),
        縣市: normalizeCounty((row['縣市'] || '').trim()),
        經度: lon,
        緯度: lat,
        座標來源: (row['座標來源'] || '').trim(),
        用煤量2024: parseNumber(row['用煤量2024']) ?? 0,
        歷年用煤,
      });
    }

    if (joinMisses.length > 0) {
      logger.info(`排除非 hub 排碳大戶 (${joinMisses.length}): ${joinMisses.join('、')}`);
    }

    // 4. Industry order by 2024 tonnage descending — the page assigns
    //    categorical colors in this fixed order
    const industryTotals = new Map<string, number>();
    for (const f of factories) {
      industryTotals.set(f.業別, (industryTotals.get(f.業別) ?? 0) + f.用煤量2024);
    }
    const 業別排序 = [...industryTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([industry]) => industry);

    const 用煤量2024合計 = factories.reduce((sum, f) => sum + f.用煤量2024, 0);
    const companyCount = new Set(factories.map(f => f.事業統編)).size;

    const output = {
      meta: {
        資料年份: 2024,
        廠數: factories.length,
        公司數: companyCount,
        用煤量2024合計,
        業別排序,
      },
      factories,
    };

    // 5. Write output
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const outputPath = join(OUTPUT_DIR, 'coal-map.json');
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    logger.success(`Saved coal map data to: coal-map.json`);

    // Summary
    logger.info('='.repeat(60));
    logger.success('Coal map data transformation completed');
    logger.info(`Factories: ${factories.length} / Companies: ${companyCount}`);
    logger.info(`2024 total coal: ${Math.round(用煤量2024合計).toLocaleString('en-US')} 公噸`);
    logger.info(`Industries: ${業別排序.join('、')}`);
    logger.logDuration();
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('Fatal error during coal map data transformation', error);
    process.exit(1);
  }
}

// Run the script
transformCoalMapData();
