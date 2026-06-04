/**
 * Fund Data Transformer
 *
 * Builds the /funds dataset by merging two upstream fund universes and joining
 * every holding to its fund and company by 統編 (Unified Business Number).
 *
 * **IMPORTANT**: Run AFTER `transform-company-data.ts` -- it needs the updated
 * `company-list.json`.
 *
 * ## Fund universe (74 funds)
 *
 * - **Manager 64** (`1WUAbVT`): every fund the manager tracks. Source tabs
 *   `XII. 基金排碳量資訊.csv` (aggregates, now with 基金統編) + `VI. 所有基金與排碳大戶對照.csv`
 *   (full holdings; filtered here to 是否排碳大戶=TRUE).
 * - **Added 10** (`1BGLJw`, FundClear ESG): ESG funds that hold 排碳大戶 but are
 *   NOT in the manager 64. These are no-ticker mutual funds. Source tabs
 *   `XIV. ESG基金summary.csv` (meta + 統編) + `XV. ESG持股明細.csv` (holdings).
 *
 * ## Identity & joins (統編 everywhere)
 *
 * - Each fund's identity / URL key is its 基金統編 (`fundKey`, 8-digit, padded by
 *   `normUBN`). Two manager umbrella sub-funds (009816, 006201) have an empty
 *   source 統編 and fall back to 基金代號 as the key. The 10 added funds have no
 *   ticker, so their display 基金代號 is left blank and the frontend shows the 統編.
 * - **Holding -> fund** joins by 基金代號 -> 統編 (never by fund name):
 *   - Manager holdings (VI) carry the real ticker -> `XII` maps 基金代號 -> fundKey.
 *   - Added holdings (XV) carry no ticker (the 基金代號 column holds the fund name);
 *     `XIII. ESG基金_sitca.csv` maps that 基金代號 -> 基金統編 (0-miss, same Colab source).
 * - **Holding -> company** joins by 統一編號 -> company-list 事業統編 (`normUBN`).
 * - **ESG flag** (`是否ESG基金`): fund 統編 is in the sitca 52-UBN set. 22 funds true
 *   (12 in-manager + 10 added).
 *
 * ## Output
 *
 * - `app/assets/data/fund-list.json` -- array of `FundData` (74 funds).
 * - `app/assets/data/funds/{fundKey}.json` -- `{ meta: FundData, companies: CompanyData[] }`
 *   for each fund that holds 排碳大戶. Coal is a single column (company-list
 *   `燃煤使用量（公噸）`); the session-14 `燃煤使用量_2026` per-holding column is gone.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './lib/logger.js';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const RAW_DATA_DIR = join(__dirname, '..', 'raw-data');
const OUTPUT_DIR = join(__dirname, '..', 'app', 'assets', 'data');
const FUNDS_OUTPUT_DIR = join(OUTPUT_DIR, 'funds');

/**
 * Company data interface (from company-list.json)
 */
interface CompanyData {
  公司: string;
  產業分類: string;
  '溫室氣體排放量（公噸二氧化碳當量）': string;
  淨零目標年: string;
  '2030 年減量目標設定': string;
  'SBTi 承諾': string;
  '>> 雷達圖數據': string;
  '2030年溫室氣體絕對減量目標': string;
  '2030年再生能源使用率目標': string;
  '2030年能源效率進步目標': string;
  '2024年再生能源使用率': string;
  '2022-2024年能源效率進步率': string;
  範疇三及減量策略: string;
  有具體減量策略: string;
  範疇三揭露: string;
  範疇三減量規劃: string;
  近三年能效進步率: string;
  節能目標設定: string;
  再生能源使用率: string;
  再生能源設置容量: string;
  是否完成用電大戶再生能源設置義務: string;
  中期再生能源目標設定: string;
  'RE100 承諾': string;
  '燃煤使用量（公噸）': string;
  代表縣市: string;
  事業統編: string;
  公司全名: string;
}

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
 * Parse a number string from CSV (handles $ and commas)
 */
function parseNumber(value: string): number {
  if (!value || value === '') return 0;
  // Remove $, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Normalize an 8-digit Unified Business Number for joining (strip non-digits,
 *  pad leading zeros). */
function normUBN(v: string | undefined): string {
  if (!v) return '';
  const digits = String(v).replace(/\D/g, '');
  return digits ? digits.padStart(8, '0') : '';
}

/** Read a raw-data CSV into rows of {header: value}. */
function readCsv(filename: string): Record<string, string>[] {
  return parseCSV(readFileSync(join(RAW_DATA_DIR, filename), 'utf-8'));
}

/**
 * Fund data interface
 */
interface FundData {
  基金代號: string; // ticker; '' for no-ticker (added) funds
  基金名稱: string;
  基金統編: string; // '' for the two umbrella sub-funds whose source 統編 is empty
  總市值: number; // in million NTD
  排碳大戶家數: number;
  排碳大戶佔比: number; // percentage
  排碳大戶總碳排量: number;
  使用燃煤家數: number;
  是否ESG基金: boolean;
  fundKey: string; // 統編 || 代號 -- the JSON filename + URL key
}

/**
 * Build a FundData from a fund-summary row (XII for manager, XIV for added).
 * `isAdded` funds are no-ticker ESG funds: blank the 基金代號 (source column holds
 * the name) and force the ESG flag true.
 */
function buildFund(
  row: Record<string, string>,
  opts: { isAdded: boolean; esgUbnSet: Set<string> }
): FundData {
  const 持股企業數 = parseNumber(row['持股企業數']);
  const 排碳大戶家數 = parseNumber(row['排碳大戶家數']);
  const ubn = normUBN(row['基金統編']);
  const sourceCode = (row['基金代號'] || '').trim();
  return {
    基金代號: opts.isAdded ? '' : sourceCode,
    基金名稱: row['基金全稱'] || row['基金名稱'] || '', // display full name
    // Canonical 8-digit UBN (sources may drop leading zeros, e.g. 00526748 -> 526748).
    基金統編: ubn,
    總市值: Math.round(parseNumber(row['總市值（百萬新台幣）'])), // already 百萬
    排碳大戶家數,
    排碳大戶佔比: 持股企業數 > 0 ? Math.round((排碳大戶家數 / 持股企業數) * 10000) / 100 : 0,
    排碳大戶總碳排量: parseNumber(row['排碳大戶總碳排量（公噸CO2e）']),
    使用燃煤家數: parseNumber(row['使用燃煤家數']),
    是否ESG基金: opts.isAdded ? true : ubn ? opts.esgUbnSet.has(ubn) : false,
    fundKey: ubn || sourceCode,
  };
}

/**
 * Join holdings (VI manager + XV added) to funds and companies, keyed by fundKey.
 * Manager holdings resolve via the ticker map; added holdings via the sitca
 * 基金代號 -> 統編 bridge, kept to the added universe only (so the 12 in-manager ESG
 * funds present in XV are not double-counted -- they come from VI).
 */
function generateFundCompanyLists(
  managerHoldings: Record<string, string>[],
  addedHoldings: Record<string, string>[],
  mgrCodeToFundKey: Map<string, string>,
  esgCodeToUbn: Map<string, string>,
  addedUbnSet: Set<string>,
  companyListData: CompanyData[],
  logger: Logger
): Map<string, CompanyData[]> {
  // Company lookup by Unified Business Number (project rule: join by 統編, not
  // name -- 臺/台 variants and renames silently fail on name joins).
  const companyByUBN = new Map<string, CompanyData>();
  companyListData.forEach(c => {
    const ubn = normUBN(c.事業統編);
    if (ubn) companyByUBN.set(ubn, c);
  });

  const fundCompanyLists = new Map<string, CompanyData[]>();
  const seenPerFund = new Map<string, Set<string>>();
  let unmatched = 0;

  const addHolding = (fundKey: string | undefined, companyUbn: string, label: string) => {
    if (!fundKey || !companyUbn) return;
    const company = companyByUBN.get(companyUbn);
    if (!company) {
      unmatched++;
      logger.info(`[WARNING] Holding UBN ${companyUbn} (${label}) not in company-list.json`);
      return;
    }
    if (!seenPerFund.has(fundKey)) seenPerFund.set(fundKey, new Set());
    const seen = seenPerFund.get(fundKey)!;
    if (seen.has(companyUbn)) return; // a fund holds a company once
    seen.add(companyUbn);
    if (!fundCompanyLists.has(fundKey)) fundCompanyLists.set(fundKey, []);
    fundCompanyLists.get(fundKey)!.push(company);
  };

  // Manager holdings (VI): resolve fund by real ticker.
  managerHoldings.forEach(row => {
    if (String(row['是否排碳大戶']).trim().toUpperCase() !== 'TRUE') return;
    const fundKey = mgrCodeToFundKey.get((row['基金代號'] || '').trim());
    addHolding(fundKey, normUBN(row['統一編號']), row['證券簡稱'] || '');
  });

  // Added holdings (XV): resolve 基金代號 -> 統編 via sitca; keep only the added 10.
  addedHoldings.forEach(row => {
    if (String(row['是否排碳大戶']).trim().toUpperCase() !== 'TRUE') return;
    const ubn = esgCodeToUbn.get((row['基金代號'] || '').trim());
    if (!ubn || !addedUbnSet.has(ubn)) return; // skip in-manager ESG funds (counted via VI)
    addHolding(ubn, normUBN(row['統一編號']), row['證券簡稱'] || '');
  });

  fundCompanyLists.forEach((companies, fundKey) =>
    logger.info(`Fund ${fundKey}: ${companies.length} companies`)
  );
  logger.info(`Found ${fundCompanyLists.size} funds with 排碳大戶 holdings`);
  if (unmatched > 0) logger.info(`[WARNING] ${unmatched} holding rows had no company-list match`);

  return fundCompanyLists;
}

/**
 * Main transformation function
 */
async function transformFundData() {
  const logger = new Logger();

  try {
    logger.info('Starting fund data transformation');
    logger.info('='.repeat(60));

    // Read all source CSVs
    const managerSummary = readCsv('XII. 基金排碳量資訊.csv'); // manager 64 aggregates (+統編)
    const managerHoldings = readCsv('VI. 所有基金與排碳大戶對照.csv'); // manager raw_holdings
    const sitca = readCsv('XIII. ESG基金_sitca.csv'); // ESG 基金代號 <-> 統編 reference (52)
    const esgSummary = readCsv('XIV. ESG基金summary.csv'); // ESG aggregates (+統編) (52)
    const esgHoldings = readCsv('XV. ESG持股明細.csv'); // ESG raw_holdings
    logger.info(
      `Parsed CSVs -- manager: ${managerSummary.length} funds / ${managerHoldings.length} holdings; ` +
        `ESG: ${esgSummary.length} funds / ${esgHoldings.length} holdings; sitca: ${sitca.length}`
    );

    // Read company list JSON
    const companyListPath = join(OUTPUT_DIR, 'company-list.json');
    let companyListData: CompanyData[];
    try {
      companyListData = JSON.parse(readFileSync(companyListPath, 'utf-8'));
      logger.info(`Loaded ${companyListData.length} company records`);
    } catch (error) {
      logger.error('Failed to read company-list.json', error);
      logger.error('Please run transform-company-data.ts first!');
      process.exit(1);
    }

    logger.info('='.repeat(60));

    // ESG reference sets from sitca (authoritative 基金代號 <-> 統編).
    const esgUbnSet = new Set(sitca.map(r => normUBN(r['基金統編'])).filter(Boolean));
    const esgCodeToUbn = new Map<string, string>();
    sitca.forEach(r => {
      const code = (r['基金代號'] || '').trim();
      const ubn = normUBN(r['基金統編']);
      if (code && ubn) esgCodeToUbn.set(code, ubn);
    });

    // Manager 64.
    const managerFunds = managerSummary
      .filter(row => (row['基金代號'] || '').trim())
      .map(row => buildFund(row, { isAdded: false, esgUbnSet }));
    const managerUbnSet = new Set(managerFunds.map(f => normUBN(f.基金統編)).filter(Boolean));

    // Added: ESG funds that hold 排碳大戶 and are not already in the manager 64.
    const addedRows = esgSummary.filter(
      row =>
        parseNumber(row['排碳大戶家數']) > 0 && !managerUbnSet.has(normUBN(row['基金統編']))
    );
    const addedFunds = addedRows.map(row => buildFund(row, { isAdded: true, esgUbnSet }));
    const addedUbnSet = new Set(addedFunds.map(f => normUBN(f.基金統編)).filter(Boolean));

    const fundList: FundData[] = [...managerFunds, ...addedFunds];
    logger.success(
      `Built ${fundList.length} funds (${managerFunds.length} manager + ${addedFunds.length} added); ` +
        `${fundList.filter(f => f.是否ESG基金).length} ESG`
    );

    // Manager ticker -> fundKey (for VI holding resolution).
    const mgrCodeToFundKey = new Map<string, string>();
    managerFunds.forEach(f => {
      if (f.基金代號) mgrCodeToFundKey.set(f.基金代號, f.fundKey);
    });

    // Generate per-fund company lists (keyed by fundKey).
    logger.info('Generating per-fund company lists...');
    const fundCompanyLists = generateFundCompanyLists(
      managerHoldings,
      esgHoldings,
      mgrCodeToFundKey,
      esgCodeToUbn,
      addedUbnSet,
      companyListData,
      logger
    );

    // Create output directories
    mkdirSync(OUTPUT_DIR, { recursive: true });
    mkdirSync(FUNDS_OUTPUT_DIR, { recursive: true });

    // Write fund list JSON
    const fundListPath = join(OUTPUT_DIR, 'fund-list.json');
    writeFileSync(fundListPath, JSON.stringify(fundList, null, 2), 'utf-8');
    logger.success(`Saved fund list to: fund-list.json`);

    // Map fundKey -> metadata for per-fund files.
    const fundMetaMap = new Map<string, FundData>();
    fundList.forEach(fund => fundMetaMap.set(fund.fundKey, fund));

    // Remove stale per-fund JSON from previous runs so the directory mirrors the
    // current fund universe (keys changed from 基金代號 to 基金統編 this round).
    const validFundKeys = new Set(fundList.map(f => f.fundKey));
    let removedStaleFiles = 0;
    for (const entry of readdirSync(FUNDS_OUTPUT_DIR)) {
      if (!entry.endsWith('.json')) continue;
      const key = entry.slice(0, -'.json'.length);
      if (validFundKeys.has(key)) continue;
      unlinkSync(join(FUNDS_OUTPUT_DIR, entry));
      removedStaleFiles++;
    }
    if (removedStaleFiles > 0) {
      logger.info(`Removed ${removedStaleFiles} stale per-fund JSON file(s)`);
    }

    let savedFundFiles = 0;
    fundCompanyLists.forEach((companies, fundKey) => {
      const fundMeta = fundMetaMap.get(fundKey);
      if (!fundMeta) {
        logger.info(`[WARNING] Fund ${fundKey} metadata not found, skipping file creation`);
        return;
      }
      const fundDetail = { meta: fundMeta, companies };
      writeFileSync(
        join(FUNDS_OUTPUT_DIR, `${fundKey}.json`),
        JSON.stringify(fundDetail, null, 2),
        'utf-8'
      );
      savedFundFiles++;
    });
    logger.success(`Saved ${savedFundFiles} fund company lists to: funds/`);

    // Summary
    logger.info('='.repeat(60));
    logger.success('Data transformation completed successfully');
    logger.info(`Total funds: ${fundList.length} | ESG: ${fundList.filter(f => f.是否ESG基金).length}`);
    logger.info(`Per-fund files written: ${savedFundFiles}`);
    logger.logDuration();
    logger.info('='.repeat(60));
  } catch (error) {
    logger.error('Fatal error during data transformation', error);
    process.exit(1);
  }
}

// Run the script
transformFundData();
