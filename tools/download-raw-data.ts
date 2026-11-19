/**
 * Download raw data from Google Sheets and save as CSV files
 *
 * This script implements Phase 1 (items 1 & 2) of the data source roadmap:
 * - Fetches data from Google Sheets API
 * - Uses tab names as CSV filenames
 * - Logs all operations for transparency and traceability
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { writeFileSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './lib/logger.js';
import { checkFundTabs } from './lib/fund-checks.js';
import {
  checkTabValues,
  decideGroups,
  groupLabel,
  groupTabs,
  summarizeOutcomes,
  type ConsumedTab,
  type GroupCheck,
  type TabFetch,
} from './lib/sync-groups.js';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration from environment variables
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// Whitelist of Sheet B tabs the build actually consumes. Sheet B has ~34 tabs;
// downloading every tab created ~24 orphan CSVs in raw-data/ that nothing read,
// drowning out the signal. Add a row here when a new transform / analyze
// script picks up a Sheet B tab; remove a row when no consumer is left.
const CONSUMED_TABS: ConsumedTab[] = [
  { tab: 'I. 總表（易讀版）', consumers: ['tools/transform-company-data.ts'] },
  { tab: 'I. 總表（進階版）', consumers: ['tools/transform-company-data.ts'] },
  { tab: 'I. 總表各欄數值分級', consumers: ['tools/transform-company-data.ts'] },
  { tab: 'XII. 基金排碳量資訊', consumers: ['tools/transform-fund-data.ts'] },
  { tab: '排碳大戶表_Data', consumers: ['tools/transform-company-data.ts', 'tools/transform-coal-map-data.ts'] },
  { tab: '雷達圖_Data', consumers: ['tools/transform-company-data.ts'] },
  { tab: '溫室氣體排放', consumers: ['tools/transform-trend-data.ts', 'tools/transform-company-data.ts'] },
  { tab: '能源消耗', consumers: ['tools/transform-trend-data.ts'] },
  { tab: 'VI. 所有基金與排碳大戶對照', consumers: ['tools/transform-fund-data.ts'] },
  { tab: 'XIII. ESG基金_sitca', consumers: ['tools/transform-fund-data.ts'] },
  { tab: 'XIV. ESG基金summary', consumers: ['tools/transform-fund-data.ts'] },
  { tab: 'XV. ESG持股明細', consumers: ['tools/transform-fund-data.ts'] },
  {
    tab: '工廠縣市排放_歷年',
    consumers: [
      'tools/transform-region-map-data.ts',
      'tools/transform-company-data.ts',
      'tools/transform-top-company-region-data.ts',
    ],
  },
  { tab: '廠座標', consumers: ['tools/transform-top-company-region-data.ts'] },
  { tab: '用煤者_廠', consumers: ['tools/transform-coal-map-data.ts'] },
  { tab: '用煤者_公司', consumers: ['tools/transform-company-data.ts', 'tools/transform-coal-usage-data.ts'] },
  { tab: '用煤者產業對照', consumers: ['tools/transform-coal-map-data.ts'] },
  { tab: '燃煤工廠座標', consumers: ['tools/transform-coal-map-data.ts'] },
  {
    tab: '鋼鐵業用煤_歷年',
    consumers: [
      'tools/transform-company-data.ts',
      'tools/transform-coal-usage-data.ts',
      'tools/transform-coal-map-data.ts',
    ],
  },
  { tab: '鋼鐵業工廠對照', consumers: ['tools/transform-coal-map-data.ts'] },
];

const GROUP_CHECKS: Record<string, GroupCheck> = {
  'tools/transform-fund-data.ts': checkFundTabs,
};

const FUND_ONLY = process.argv.includes('--fund-only');
const TABS = FUND_ONLY
  ? CONSUMED_TABS.filter(({ consumers }) => consumers.includes('tools/transform-fund-data.ts'))
  : CONSUMED_TABS;

// Output directory for raw CSV files
const RAW_DATA_DIR = join(__dirname, '..', 'raw-data');

/**
 * Convert 2D array to CSV string
 */
function arrayToCSV(data: unknown[][]): string {
  return data
    .map(row =>
      row
        .map(cell => {
          // Handle null/undefined
          if (cell === null || cell === undefined) {
            return '';
          }
          // Convert to string
          const str = String(cell);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Main function to download data from Google Sheets
 */
async function downloadRawData() {
  const logger = new Logger();

  try {
    // Validate environment variables
    if (!API_KEY) {
      throw new Error('GOOGLE_SHEETS_API_KEY is not set in .env file');
    }
    if (!SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEETS_ID is not set in .env file');
    }

    logger.info('Starting data download from Google Sheets');
    logger.info(`Spreadsheet ID: ${SPREADSHEET_ID}`);

    // Initialize Google Sheets API
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });

    logger.info(`Downloading ${TABS.length} whitelisted Sheet B tabs`);

    // Create raw-data directory if it doesn't exist
    try {
      mkdirSync(RAW_DATA_DIR, { recursive: true });
      logger.info(`Output directory: ${RAW_DATA_DIR}`);
    } catch (error) {
      logger.error('Failed to create output directory', error);
      throw error;
    }

    const fetched = new Map<string, TabFetch>();

    for (const { tab, consumers } of TABS) {
      try {
        logger.info(`Fetching tab: "${tab}" (consumed by ${consumers.join(', ')})`);

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: tab,
        });

        const values = response.data.values;
        const problem = checkTabValues(values);
        if (problem !== null || !values) {
          throw new Error(problem ?? 'tab is empty');
        }

        fetched.set(tab, { ok: true, csv: arrayToCSV(values) });
        logger.success(`Fetched "${tab}" (${values.length} rows, ${values[0]?.length || 0} columns)`);
      } catch (error) {
        logger.error(`Failed to download tab "${tab}"`, error);
        fetched.set(tab, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const outcomes = decideGroups(groupTabs(TABS), fetched, GROUP_CHECKS);

    for (const outcome of outcomes) {
      const label = groupLabel(outcome.group);
      if (outcome.failure) {
        const { tab, error } = outcome.failure;
        logger.error(`Skipped group [${label}]: "${tab}" failed (${error}); its ${outcome.group.tabs.length} CSVs are left as they were`);
        console.log(`::error title=Tab group skipped::[${label}] "${tab}" failed: ${error}`);
        continue;
      }
      for (const [tab, csv] of outcome.csvByTab) {
        const fileName = `${tab}.csv`;
        writeFileSync(join(RAW_DATA_DIR, fileName), csv, 'utf-8');
        logger.success(`Saved "${tab}" to ${fileName}`);
      }
    }

    const skippedCount = outcomes.filter(outcome => outcome.failure).length;
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `skipped=${skippedCount > 0}\n`);
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n#### Tab groups\n\n${summarizeOutcomes(outcomes)}\n\n`);
    }

    // Summary
    logger.info('='.repeat(60));
    logger.success(`Synced groups: ${outcomes.length - skippedCount} of ${outcomes.length}`);
    if (skippedCount > 0) {
      logger.error(`Skipped groups: ${skippedCount} of ${outcomes.length}`);
    }
    logger.logDuration();
    logger.info('='.repeat(60));

    if (skippedCount === outcomes.length) {
      logger.error('Every tab group was skipped; nothing to publish');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Fatal error during data download', error);
    process.exit(1);
  }
}

// Run the script
downloadRawData();
