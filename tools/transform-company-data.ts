/**
 * Company Data Transformer
 * 
 * This script implements Phase 1 (item 3) of the data source roadmap:
 * - Reads raw CSV files from raw-data/
 * - Transforms data into unified JSON schema for UI layer
 * - Outputs to app/assets/data/ directory
 * 
 * ## Usage
 * 
 * ```bash
 * npm run transform-company-data
 * ```
 * 
 * ## Input
 * 
 * - **Source 1**: `raw-data/I. 總表（易讀版）.csv` - Basic company data
 * - **Source 2**: `raw-data/I. 總表（進階版）.csv` - Advanced company data
 * - **Source 3**: `raw-data/I. 總表各欄數值分級.csv` - Grade mapping for numeric fields
 * 
 * ## Output
 * 
 * ### Company List (`app/assets/data/company-list.json`)
 * 
 * Merged data from basic and advanced company tables.
 * 
 * ### Company Grade Map (`app/assets/data/company-grade-map.json`)
 * 
 * Grade mapping for numeric fields:
 * 
 * ```typescript
 * interface GradeMap {
 *   [欄位名稱: string]: Array<{
 *     max?: number;
 *     min?: number;
 *     label: string;
 *   }>;
 * }
 * ```
 * 
 * ### Region List (`app/assets/data/region-list.json`)
 *
 * Array of counties where at least one of the 287 排碳大戶 operates a factory
 * (year 113), ordered north-to-south. Sourced from each company's
 * factoryCounties so the /companies?region=XX dropdown matches the home page
 * map's 排碳縣市分佈 — clicking the map and selecting from the dropdown both
 * include the same set of companies (any UBN with a factory in that county,
 * not just UBNs whose HQ 代表縣市 matches).
 * 
 * ### Industry List (`app/assets/data/industry-list.json`)
 * 
 * Array of 產業分類 with counts, ordered by count descending:
 * 
 * ```typescript
 * Array<{ industry: string; count: number }>
 * ```
 * 
 * ## Implementation Notes
 * 
 * - Uses CSV parser that handles quoted fields and special characters
 * - Merges basic and advanced data by company name (公司)
 * - Logs all operations for transparency and traceability
 * - Follows the data source roadmap (Phase 1, item 3)
 * - missing abbr: 國巨, 彩晶, 穩懋, 永豐實, 唐榮公司, 中碳, 中環, 精金, 台燿, 晶碩, 台達化, 台耀, 環泰, 台鹽, 台半
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './lib/logger.js';
import { normalizeCounty, normalizeUBN } from './lib/normalize.js';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const RAW_DATA_DIR = join(__dirname, '..', 'raw-data');
const OUTPUT_DIR = join(__dirname, '..', 'app', 'assets', 'data');

/**
 * Parse CSV string to array of objects
 */
function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  
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
function parseCSVLine(line: string): string[] {
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
 * Parse a number string from CSV (handles commas and whitespace)
 */
function parseNumber(value: string): number | undefined {
  if (!value || value === '') return undefined;
  // Remove commas and whitespace
  const cleaned = value.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

/**
 * Grade definition interface
 */
interface GradeDefinition {
  max?: number;
  min?: number;
  label: string;
}

/**
 * Grade map interface
 */
type GradeMap = Record<string, GradeDefinition[]>;

/**
 * Transform grade map data
 */
function transformGradeMap(rawData: Record<string, string>[]): GradeMap {
  const gradeMap: GradeMap = {};
  
  for (const row of rawData) {
    const 欄位名稱 = row['欄位名稱'];
    const 分級名稱 = row['分級名稱'];
    
    if (!欄位名稱 || !分級名稱) {
      continue;
    }
    
    if (!gradeMap[欄位名稱]) {
      gradeMap[欄位名稱] = [];
    }
    
    const grade: GradeDefinition = {
      label: 分級名稱,
    };
    
    const minValue = parseNumber(row['最小值']);
    const maxValue = parseNumber(row['最大值']);
    
    if (minValue !== undefined) {
      grade.min = minValue;
    }
    if (maxValue !== undefined) {
      grade.max = maxValue;
    }
    
    gradeMap[欄位名稱].push(grade);
  }
  
  return gradeMap;
}

/**
 * Merge company data from basic and advanced tables
 */
function mergeCompanyData(
  basicData: Record<string, string>[],
  advancedData: Record<string, string>[]
): Record<string, string>[] {
  // Create a map for quick lookup of advanced data by company name
  const advancedMap = new Map<string, Record<string, string>>();
  for (const row of advancedData) {
    const companyName = row['公司'];
    if (companyName) {
      advancedMap.set(companyName, row);
    }
  }
  
  // Merge basic and advanced data
  const mergedData: Record<string, string>[] = [];
  
  for (const basicRow of basicData) {
    const companyName = basicRow['公司'];
    const advancedRow = advancedMap.get(companyName);
    
    // Merge basic row with advanced row (advanced data takes precedence for duplicate keys)
    const mergedRow: Record<string, string> = {
      ...basicRow,
      ...(advancedRow || {}),
    };
    
    mergedData.push(mergedRow);
  }
  
  return mergedData;
}

/**
 * Add 代表縣市, 事業統編, 公司全名 to each company.
 *
 * Sources:
 *   - 統一編號 + 公司全稱: hub 排碳大戶表_Data (SOT-derived, covers all 287).
 *   - 代表縣市: II. 公司總表 (max-emission county, semantically distinct from
 *     hub's 最大廠所處縣市 which is the single largest factory; for multi-factory
 *     companies the two can disagree — II.'s aggregation is the canonical one).
 */
function addRepresentativeCity(
  companyList: Record<string, string>[],
  companyDetailData: Record<string, string>[],
  hubData: Record<string, string>[],
  logger: Logger
): Record<string, string>[] {
  logger.info('Step 3: Adding 代表縣市, 事業統編, and 公司全名 data');

  // Hub: 公司簡稱 -> { 統一編號, 公司全稱 }. Authoritative for all 287 companies.
  const hubByAbbr = new Map<string, { taxCode: string; fullName: string }>();
  for (const row of hubData) {
    const abbr = row['公司簡稱']?.trim();
    const taxCode = row['統一編號']?.trim();
    const fullName = row['公司全稱']?.trim() ?? '';
    if (abbr && taxCode) {
      hubByAbbr.set(abbr, { taxCode, fullName });
    }
  }
  logger.info(`Loaded ${hubByAbbr.size} 公司簡稱 mappings from 排碳大戶表_Data.csv`);

  // II. 公司總表: 事業統編 -> 代表縣市. Max-emission county per company.
  const taxCodeToCity = new Map<string, string>();
  for (const detail of companyDetailData) {
    const taxCode = detail['事業統編']?.trim();
    const city = detail['代表縣市']?.trim();
    if (taxCode && city) {
      taxCodeToCity.set(taxCode, city);
    }
  }
  logger.info(`Loaded ${taxCodeToCity.size} city mappings from II. 公司總表（原始值）.csv`);

  let successCount = 0;
  const failedCompanies: string[] = [];

  for (const company of companyList) {
    const companyName = company['公司'];
    const hubMatch = hubByAbbr.get(companyName);

    if (!hubMatch) {
      failedCompanies.push(companyName);
      logger.info(`Cannot find tax_code for company: ${companyName}`);
      continue;
    }

    const { taxCode, fullName } = hubMatch;
    const city = taxCodeToCity.get(taxCode) ?? '';

    if (!city) {
      failedCompanies.push(companyName);
      logger.info(`Cannot find 代表縣市 for company: ${companyName} (tax_code: ${taxCode})`);
      company['事業統編'] = taxCode;
      if (fullName) company['公司全名'] = fullName;
      continue;
    }

    company['代表縣市'] = city;
    company['事業統編'] = taxCode;
    if (fullName) company['公司全名'] = fullName;
    successCount++;
  }

  logger.success(`Successfully added 代表縣市 for ${successCount}/${companyList.length} companies`);
  if (failedCompanies.length > 0) {
    logger.info(`Failed to map ${failedCompanies.length} companies:`);
    failedCompanies.forEach(name => logger.info(`  - ${name}`));
  }

  return companyList;
}

/**
 * Override the 年碳排 (latest emission) and 年度變化 (YoY) on each company using
 * the SOT 溫室氣體排放 tab in raw-data/溫室氣體排放.csv (the same SOT that powers
 * the trend charts). Falls back to leaving the 易讀版 value in place for the
 * handful of companies whose 公司全名 doesn't appear in the SOT tab.
 *
 * Why: 易讀版 carries a 排放量 snapshot from an older year (台塑化's
 * 24,467,047 was the 2022 number), and the hub 總碳排放量_2024 column was also
 * stale, so CompanyHeader was displaying outdated numbers and an incorrect
 * 較去年 delta. The SOT tab keeps 2022/2023/2024 fields in lockstep.
 */
function applyLatestEmissionFromTrend(
  companyList: Record<string, string>[],
  trendCsvData: Record<string, string>[],
  logger: Logger
): Record<string, string>[] {
  const parseNum = (raw: string | undefined): number | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'NA' || trimmed === 'N/A' || trimmed.startsWith('#')) {
      return null;
    }
    const n = parseFloat(trimmed.replace(/,/g, ''));
    return isNaN(n) ? null : n;
  };

  // Build 事業統編 (8-digit, zero-padded) → {2023, 2024} map. UBN is more
  // reliable than 公司全名 — name matching misses 臺/台 variants (台泥, 台紙,
  // 台鹽, 台群, 湯淺電池) and corporate renames (中華凸版電子 → 中華科盛德光罩,
  // same UBN).
  const padUbn = (raw: string | undefined): string =>
    (raw || '').trim().padStart(8, '0');

  const byUbn = new Map<
    string,
    { e2022: number | null; e2023: number | null; e2024: number | null }
  >();
  for (const row of trendCsvData) {
    const ubn = padUbn(row['事業統編']);
    if (!ubn) continue;
    byUbn.set(ubn, {
      e2022: parseNum(row['2022總排放']),
      e2023: parseNum(row['2023總排放']),
      e2024: parseNum(row['2024總排放']),
    });
  }
  logger.info(`Loaded latest-year emissions for ${byUbn.size} companies from 溫室氣體排放.csv`);

  // Pick the most recent year that has a non-zero report. Trend SOT
  // occasionally has 0 for the latest year when the company hasn't published
  // its sustainability report yet; "0 噸" displayed on the website would
  // misrepresent that as actual zero emission.
  const pickLatest = (
    e: { e2022: number | null; e2023: number | null; e2024: number | null }
  ): { value: number; year: 2022 | 2023 | 2024 } | null => {
    if (e.e2024 !== null && e.e2024 > 0) return { value: e.e2024, year: 2024 };
    if (e.e2023 !== null && e.e2023 > 0) return { value: e.e2023, year: 2023 };
    if (e.e2022 !== null && e.e2022 > 0) return { value: e.e2022, year: 2022 };
    return null;
  };

  let updatedEmission = 0;
  let updatedDelta = 0;
  let fallbackToOlder = 0;
  let missingMatch = 0;

  for (const company of companyList) {
    const ubn = padUbn(company['事業統編']);
    const entry = ubn ? byUbn.get(ubn) : undefined;

    if (!entry) {
      // Keep existing 易讀版 value; null out 年度變化 unless already computed elsewhere.
      if ((company as Record<string, unknown>)['年度變化'] === undefined) {
        (company as Record<string, unknown>)['年度變化'] = null;
      }
      missingMatch++;
      continue;
    }

    const latest = pickLatest(entry);
    if (latest) {
      company['溫室氣體排放量（公噸二氧化碳當量）'] = Math.round(latest.value).toLocaleString('en-US');
      updatedEmission++;
      if (latest.year !== 2024) fallbackToOlder++;
    }

    // 年度變化 stays strict: only show when both 2023 and 2024 actual values
    // are present and positive. For companies whose 2024 fell back to an
    // earlier year, hide the delta (no meaningful YoY).
    if (entry.e2023 !== null && entry.e2023 > 0 && entry.e2024 !== null && entry.e2024 > 0) {
      const delta = ((entry.e2024 - entry.e2023) / entry.e2023) * 100;
      (company as Record<string, unknown>)['年度變化'] = Math.round(delta * 10) / 10;
      updatedDelta++;
    } else {
      (company as Record<string, unknown>)['年度變化'] = null;
    }
  }

  logger.success(
    `Overrode 年碳排 from SOT 溫室氣體排放: ${updatedEmission}/${companyList.length}` +
      (fallbackToOlder > 0 ? ` (${fallbackToOlder} fell back to 2023 or 2022 because 2024 was 0/null)` : '')
  );
  logger.success(
    `Computed 年度變化 from SOT 2023→2024: ${updatedDelta}/${companyList.length}`
  );
  if (missingMatch > 0) {
    logger.info(`  ${missingMatch} companies fell through (事業統編 not in SOT tab)`);
  }

  return companyList;
}

/**
 * Add per-company top-3 縣市 emission distribution from the upstream SOT
 * 工廠縣市排放_歷年.csv (factory-level rows with 年度 / 事業統編 / 縣市別 /
 * 合計排放量). Filtered to ROC year 113 (= 2024). Bridged to companyList via
 * 事業統編 — more reliable than 公司全名 string matching.
 *
 * 縣市佔比 = company emission in county / sum of all 排碳大戶 emissions in
 *           that county × 100  (advocacy framing: company's domination of
 *           the county's emission footprint).
 *
 * Year-2024 coverage: ~282/287 companies match; the handful that don't were
 * registered as 排碳大戶 in earlier years but fall under the 25,000 tCO2e/廠
 * threshold for 2024 and so are not in this SOT — they keep no regionEmissions
 * and the county cards hide for them.
 */
function addRegionEmissionsFromFactorySOT(
  companyList: Record<string, string>[],
  factoryRows: Record<string, string>[],
  logger: Logger,
  yearFilter: string = '113'
): Record<string, string>[] {
  const parseAmount = (raw: string | undefined): number => {
    if (!raw) return 0;
    const n = parseFloat(raw.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // Whitelist of UBNs in our 287-company list — scopes county totals and
  // 企業數 to "排碳大戶 in this site's dataset", which naturally excludes
  // 電力供應業 (台電 et al. are not in our list) and avoids double-counting
  // consumer Scope 2 against producer Scope 1.
  const allowedUBNs = new Set<string>();
  for (const c of companyList) {
    const u = (c['事業統編'] || '').trim();
    if (u) allowedUBNs.add(u);
  }

  // Aggregate (UBN, county) → emission for the chosen year + per-county totals
  const byUBN = new Map<string, Map<string, number>>();
  const countyTotals: Record<string, number> = {};
  let yearRowCount = 0;

  for (const row of factoryRows) {
    if (row['年度'] !== yearFilter) continue;
    yearRowCount++;
    const ubn = normalizeUBN(row['事業統編']);
    if (!ubn || !allowedUBNs.has(ubn)) continue;
    const county = normalizeCounty((row['縣市別'] || '').trim());
    const amt = parseAmount(row['合計排放量(公噸CO2e)']);
    if (!county || amt <= 0) continue;

    if (!byUBN.has(ubn)) byUBN.set(ubn, new Map());
    const ubnMap = byUBN.get(ubn)!;
    ubnMap.set(county, (ubnMap.get(county) || 0) + amt);
    countyTotals[county] = (countyTotals[county] || 0) + amt;
  }
  logger.info(
    `Factory SOT year ${yearFilter}: ${yearRowCount} rows total, ${byUBN.size} 事業統編 within our list, ${Object.keys(countyTotals).length} 縣市`
  );

  let attached = 0;
  let noUBN = 0;
  let noMatch = 0;

  for (const company of companyList) {
    const ubn = (company['事業統編'] || '').trim();
    if (!ubn) { noUBN++; continue; }

    const ubnMap = byUBN.get(ubn);
    if (!ubnMap) { noMatch++; continue; }

    const sortedEntries = Array.from(ubnMap.entries())
      .map(([county, amt]) => {
        const total = countyTotals[county] || 0;
        const share = total > 0 ? Math.round((amt / total) * 1000) / 10 : 0;
        return { 縣市: county, 排放量: Math.round(amt), 縣市佔比: share };
      })
      .sort((a, b) => b.排放量 - a.排放量);

    const items = sortedEntries.slice(0, 3);

    // factoryCounties is the FULL set of counties this UBN operates factories
    // in (year 113) — no top-3 slice. The county filter on /companies must
    // match the map's 企業數 aggregation in region-emission-list.json, which
    // counts a UBN in every county it has a factory in.
    const factoryCounties = sortedEntries.map(e => e.縣市);

    if (items.length > 0) {
      (company as Record<string, unknown>)['regionEmissions'] = items;
      (company as Record<string, unknown>)['factoryCounties'] = factoryCounties;
      attached++;
    }
  }

  logger.success(
    `regionEmissions (factory SOT, ${yearFilter}): ${attached}/${companyList.length}`
  );
  if (noUBN > 0) logger.info(`  ${noUBN} skipped (no 事業統編)`);
  if (noMatch > 0) logger.info(`  ${noMatch} 事業統編 not in SOT 工廠縣市排放_歷年`);

  return companyList;
}

const RADAR_SCORE_FIELDS = [
  '2030年溫室氣體絕對減量目標',
  '2030年再生能源使用率目標',
  '2030年能源效率進步目標',
  '2024年再生能源使用率',
  '2022-2024年能源效率進步率',
  '範疇三及減量策略',
];

/**
 * Override the 6 radar score columns on each company with values from
 * 雷達圖_Data.csv (the canonical source). The hub CSV (排碳大戶表_Data.csv)
 * provides the 公司簡稱 → 統一編號 mapping for all 287 companies.
 */
function applyRadarScoresFromSource(
  companyList: Record<string, string>[],
  hubData: Record<string, string>[],
  radarData: Record<string, string>[],
  logger: Logger
): Record<string, string>[] {
  const nameToUbn = new Map<string, string>();
  for (const row of hubData) {
    const abbr = row['公司簡稱']?.trim();
    const ubn = row['統一編號']?.trim();
    if (abbr && ubn) nameToUbn.set(abbr, ubn);
  }

  const ubnToScores = new Map<string, Record<string, string>>();
  for (const row of radarData) {
    const ubn = row['統一編號']?.trim();
    if (!ubn) continue;
    const scores: Record<string, string> = {};
    for (const field of RADAR_SCORE_FIELDS) scores[field] = row[field] ?? '';
    ubnToScores.set(ubn, scores);
  }

  let matched = 0;
  const unmatched: string[] = [];
  for (const company of companyList) {
    const name = company['公司']?.trim();
    const ubn = name ? nameToUbn.get(name) : undefined;
    const scores = ubn ? ubnToScores.get(ubn) : undefined;
    if (!scores) {
      unmatched.push(`${name ?? '<no name>'} (ubn=${ubn ?? 'unknown'})`);
      continue;
    }
    for (const field of RADAR_SCORE_FIELDS) company[field] = scores[field];
    matched++;
  }

  logger.success(
    `Radar scores joined from 雷達圖_Data: ${matched}/${companyList.length} companies`
  );
  if (unmatched.length > 0) {
    logger.info(`Unmatched (${unmatched.length}):`);
    unmatched.slice(0, 10).forEach(name => logger.info(`  - ${name}`));
  }

  return companyList;
}

interface IndustryAggregate {
  scoredCount: number;
  totals: number[];
}

/**
 * Build per-industry aggregates from 雷達圖_Data rows.
 *
 * Scoring is binary at the row level: every row either has all 6 axes filled
 * (integers 0-3) or all 6 axes blank. We exclude blank rows entirely from the
 * average, so `scoredCount` is a single per-industry number (not per-axis).
 * Partial rows (some axes filled, some blank) are skipped with a warning.
 */
function computeIndustryAverages(
  radarData: Record<string, string>[],
  logger: Logger
): Map<string, { scoredCount: number; avgScores: number[] }> {
  const agg = new Map<string, IndustryAggregate>();

  for (const row of radarData) {
    const industry = row['產業類別']?.trim();
    if (!industry) continue;

    const entry = agg.get(industry) ?? { scoredCount: 0, totals: [0, 0, 0, 0, 0, 0] };

    const filledCount = RADAR_SCORE_FIELDS.filter(f => {
      const v = row[f];
      return v !== undefined && v !== '' && v !== null;
    }).length;

    if (filledCount === RADAR_SCORE_FIELDS.length) {
      entry.scoredCount += 1;
      RADAR_SCORE_FIELDS.forEach((field, i) => {
        const v = Number(row[field]);
        entry.totals[i] += Number.isFinite(v) ? v : 0;
      });
    } else if (filledCount > 0) {
      logger.info(`Partial radar row skipped: industry=${industry} filled=${filledCount}/6`);
    }

    agg.set(industry, entry);
  }

  const out = new Map<string, { scoredCount: number; avgScores: number[] }>();
  for (const [industry, e] of agg) {
    const avgScores = e.scoredCount > 0
      ? e.totals.map(t => Math.round((t / e.scoredCount) * 100) / 100)
      : [0, 0, 0, 0, 0, 0];
    out.set(industry, { scoredCount: e.scoredCount, avgScores });
  }
  return out;
}

/**
 * Main transformation function
 */
async function transformCompanyData() {
  const logger = new Logger();

  try {
    logger.info('Starting company data transformation');

    // 1. Load and merge basic and advanced company data
    logger.info('Step 1: Loading company data');
    
    const basicCsvPath = join(RAW_DATA_DIR, 'I. 總表（易讀版）.csv');
    logger.info(`Reading basic data from: ${basicCsvPath}`);
    const basicCsvContent = readFileSync(basicCsvPath, 'utf-8');
    const basicData = parseCSV(basicCsvContent);
    logger.info(`Parsed ${basicData.length} records from basic table`);

    const advancedCsvPath = join(RAW_DATA_DIR, 'I. 總表（進階版）.csv');
    logger.info(`Reading advanced data from: ${advancedCsvPath}`);
    const advancedCsvContent = readFileSync(advancedCsvPath, 'utf-8');
    const advancedData = parseCSV(advancedCsvContent);
    logger.info(`Parsed ${advancedData.length} records from advanced table`);

    // Merge data
    let companyList = mergeCompanyData(basicData, advancedData);
    logger.success(`Merged company data: ${companyList.length} companies`);

    // 2. Load and transform grade map
    logger.info('Step 2: Loading grade map');
    
    const gradeMapCsvPath = join(RAW_DATA_DIR, 'I. 總表各欄數值分級.csv');
    logger.info(`Reading grade map from: ${gradeMapCsvPath}`);
    const gradeMapCsvContent = readFileSync(gradeMapCsvPath, 'utf-8');
    const gradeMapData = parseCSV(gradeMapCsvContent);
    logger.info(`Parsed ${gradeMapData.length} grade definitions`);

    const gradeMap = transformGradeMap(gradeMapData);
    const gradeMapFields = Object.keys(gradeMap);
    logger.success(`Transformed grade map: ${gradeMapFields.length} fields`);
    logger.info(`Grade map fields: ${gradeMapFields.join(', ')}`);

    // 3. Load company detail (代表縣市 lookup) + hub (統編 / 公司全稱 lookup).
    const companyDetailCsvPath = join(RAW_DATA_DIR, 'II. 公司總表（原始值）.csv');
    logger.info(`Reading company detail data from: ${companyDetailCsvPath}`);
    const companyDetailCsvContent = readFileSync(companyDetailCsvPath, 'utf-8');
    const companyDetailData = parseCSV(companyDetailCsvContent);
    logger.info(`Parsed ${companyDetailData.length} records from II. 公司總表（原始值）.csv`);

    const hubCsvPath = join(RAW_DATA_DIR, '排碳大戶表_Data.csv');
    logger.info(`Reading hub data from: ${hubCsvPath}`);
    const hubData = parseCSV(readFileSync(hubCsvPath, 'utf-8'));
    logger.info(`Parsed ${hubData.length} records from 排碳大戶表_Data.csv`);

    companyList = addRepresentativeCity(companyList, companyDetailData, hubData, logger);

    // Override 年碳排 (latest 2024) + 年度變化 (2024 vs 2023) from SOT 溫室氣體排放 tab.
    // 易讀版 carries a stale snapshot (台塑化 24,467,047 is the 2022 value), and hub
    // 總碳排放量_2024 is also stale; the SOT trend tab is the canonical source.
    const trendCsvPath = join(RAW_DATA_DIR, '溫室氣體排放.csv');
    logger.info(`Reading SOT 溫室氣體排放 from: ${trendCsvPath}`);
    const trendCsvData = parseCSV(readFileSync(trendCsvPath, 'utf-8'));
    logger.info(`Parsed ${trendCsvData.length} records from 溫室氣體排放.csv`);
    companyList = applyLatestEmissionFromTrend(companyList, trendCsvData, logger);

    // Add per-company top-3 縣市 emission distribution from factory-level SOT
    // (year 113 / 2024). Bridged via 事業統編. Replaces the older Sheet B IV. csv
    // snapshot, which was 2023 data.
    const factorySotPath = join(RAW_DATA_DIR, '工廠縣市排放_歷年.csv');
    logger.info(`Reading factory-level emission SOT from: ${factorySotPath}`);
    const factoryRows = parseCSV(readFileSync(factorySotPath, 'utf-8'));
    logger.info(`Parsed ${factoryRows.length} factory rows`);
    companyList = addRegionEmissionsFromFactorySOT(companyList, factoryRows, logger);

    // 4. Override radar score columns from 雷達圖_Data (single source of truth).
    // 易讀版 carries duplicate score columns that go stale if its snapshot is not
    // refreshed in lockstep with 雷達圖_Data. Joining via the hub (排碳大戶表_Data)
    // bridges 公司簡稱 → 統一編號 for all 287 companies.

    const radarCsvPath = join(RAW_DATA_DIR, '雷達圖_Data.csv');
    logger.info(`Reading radar source from: ${radarCsvPath}`);
    const radarRaw = readFileSync(radarCsvPath, 'utf-8');
    // First row is a section-label band ("Demo,,,目標設定,..."); real header is row 2.
    const radarTrimmed = radarRaw.slice(radarRaw.indexOf('\n') + 1);
    const radarData = parseCSV(radarTrimmed);
    logger.info(`Parsed ${radarData.length} records from 雷達圖_Data.csv`);

    companyList = applyRadarScoresFromSource(companyList, hubData, radarData, logger);

    const industryAverages = computeIndustryAverages(radarData, logger);
    logger.info(`Computed averages for ${industryAverages.size} industries`);

    // Create output directory if it doesn't exist
    mkdirSync(OUTPUT_DIR, { recursive: true });
    logger.info(`Output directory: ${OUTPUT_DIR}`);

    // Write company list JSON
    const companyListPath = join(OUTPUT_DIR, 'company-list.json');
    writeFileSync(
      companyListPath,
      JSON.stringify(companyList, null, 2),
      'utf-8'
    );
    logger.success(`Saved company list to: company-list.json`);

    // Write grade map JSON
    const gradeMapPath = join(OUTPUT_DIR, 'company-grade-map.json');
    writeFileSync(
      gradeMapPath,
      JSON.stringify(gradeMap, null, 2),
      'utf-8'
    );
    logger.success(`Saved grade map to: company-grade-map.json`);

    // Generate region list (ordered by geographic location: north to south, west to east)
    // Source: union of factoryCounties across all 287 companies. This matches
    // the home page map's 17-county set in region-emission-list.json, so the
    // dropdown contains every county a user can click on the map.
    logger.info('Step 4: Generating region list');
    const regionSet = new Set<string>();
    companyList.forEach(company => {
      const factoryCounties = (company as Record<string, unknown>)['factoryCounties'] as string[] | undefined;
      if (factoryCounties) {
        factoryCounties.forEach(c => {
          if (c && c.trim()) regionSet.add(c.trim());
        });
      }
    });

    // Manual ordering: north to south, west to east. Use 台 form (not 臺) to
    // match the factory SOT after normalizeCounty — see
    // addRegionEmissionsFromFactorySOT and transform-region-map-data.ts.
    const taiwanRegionOrder = [
      '基隆市',
      '台北市',
      '新北市',
      '桃園市',
      '新竹市',
      '新竹縣',
      '苗栗縣',
      '台中市',
      '彰化縣',
      '雲林縣',
      '嘉義市',
      '嘉義縣',
      '台南市',
      '高雄市',
      '屏東縣',
      '南投縣',
      '宜蘭縣',
      '花蓮縣',
      '台東縣',
      '澎湖縣',
      '金門縣',
      '連江縣',
    ];

    const regionList = taiwanRegionOrder.filter(region => regionSet.has(region));
    // Surface any factory counties not in the manual order so the dropdown
    // never silently drops a clickable map county.
    regionSet.forEach(region => {
      if (!taiwanRegionOrder.includes(region)) {
        logger.info(`Region not in manual order, appending: ${region}`);
        regionList.push(region);
      }
    });
    logger.info(`Found ${regionList.length} unique regions`);
    
    const regionListPath = join(OUTPUT_DIR, 'region-list.json');
    writeFileSync(
      regionListPath,
      JSON.stringify(regionList, null, 2),
      'utf-8'
    );
    logger.success(`Saved region list to: region-list.json`);

    // Generate industry list (ordered by count desc)
    logger.info('Step 5: Generating industry list');
    const industryCount = new Map<string, number>();
    companyList.forEach(company => {
      const industry = company['產業分類'];
      if (industry && industry.trim()) {
        const trimmedIndustry = industry.trim();
        industryCount.set(trimmedIndustry, (industryCount.get(trimmedIndustry) || 0) + 1);
      }
    });
    
    const industryList = Array.from(industryCount.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([industry, count]) => {
        const agg = industryAverages.get(industry);
        if (!agg) {
          logger.info(`No radar aggregate for industry: ${industry} (falling back to zeros)`);
        }
        return {
          industry,
          count,
          scoredCount: agg?.scoredCount ?? 0,
          avgScores: agg?.avgScores ?? [0, 0, 0, 0, 0, 0],
        };
      });
    
    logger.info(`Found ${industryList.length} unique industries`);

    // Cross-check: warn if any industry exists in one source but not the other.
    const radarIndustries = new Set(industryAverages.keys());
    const companyIndustries = new Set(industryCount.keys());
    for (const ind of radarIndustries) {
      if (!companyIndustries.has(ind)) {
        logger.info(`Industry in radar CSV but not company list: ${ind}`);
      }
    }
    for (const ind of companyIndustries) {
      if (!radarIndustries.has(ind)) {
        logger.info(`Industry in company list but not radar CSV: ${ind}`);
      }
    }

    const industryListPath = join(OUTPUT_DIR, 'industry-list.json');
    writeFileSync(
      industryListPath,
      JSON.stringify(industryList, null, 2),
      'utf-8'
    );
    logger.success(`Saved industry list to: industry-list.json`);

    // Generate top 10 companies by 溫室氣體排放量
    logger.info('Step 6: Generating top 10 companies by emissions');
    const companiesWithEmissions = companyList
      .map(company => {
        const emissions = parseNumber(company['溫室氣體排放量（公噸二氧化碳當量）']);
        return {
          ...company,
          emissionsValue: emissions || 0
        };
      })
      .filter(company => company.emissionsValue > 0)
      .sort((a, b) => b.emissionsValue - a.emissionsValue)
      .slice(0, 10);
    
    const top10Companies = companiesWithEmissions.map(({ emissionsValue, ...company }) => company); // Remove the temporary emissionsValue field
    
    logger.info(`Top 10 companies by emissions:`);
    companiesWithEmissions.forEach((item, index) => {
      const company = item as Record<string, string> & { emissionsValue: number };
      logger.info(`  ${index + 1}. ${company['公司']} - ${company['溫室氣體排放量（公噸二氧化碳當量）']}`);
    });
    
    const top10Path = join(OUTPUT_DIR, 'top-10-companies.json');
    writeFileSync(
      top10Path,
      JSON.stringify(top10Companies, null, 2),
      'utf-8'
    );
    logger.success(`Saved top 10 companies to: top-10-companies.json`);

    // Log sample of transformed data
    logger.info('Sample of company data (first 2 records):');
    console.log(JSON.stringify(companyList.slice(0, 2), null, 2));
    
    logger.info('Sample of grade map:');
    const sampleField = gradeMapFields[0];
    if (sampleField) {
      console.log(`Field: ${sampleField}`);
      console.log(JSON.stringify(gradeMap[sampleField], null, 2));
    }

    // Summary
    logger.info('='.repeat(60));
    logger.success('Data transformation completed successfully');
    logger.info(`Total companies processed: ${companyList.length}`);
    logger.info(`Total grade fields: ${gradeMapFields.length}`);
    logger.info(`Total regions: ${regionList.length}`);
    logger.info(`Total industries: ${industryList.length}`);
    logger.info(`Top 10 companies exported: ${top10Companies.length}`);
    logger.logDuration();
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('Fatal error during data transformation', error);
    process.exit(1);
  }
}

// Run the script
transformCompanyData();
