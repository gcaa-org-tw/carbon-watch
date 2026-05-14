/**
 * Download raw data from Google Sheets and save as CSV files
 * 
 * This script implements Phase 1 (items 1 & 2) of the data source roadmap:
 * - Fetches data from Google Sheets API
 * - Uses tab names as CSV filenames
 * - Logs all operations for transparency and traceability
 * 
 * Data source: https://docs.google.com/spreadsheets/d/e/2PACX-1vRFQ6RbeBXDgp-IgWh5ue2W0SBJqAIWR9QML0AmceoR6nO_5Q83QGsalaCDqAAyOX_pIK2hOQZ-wdwb/pubhtml
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './lib/logger.js';

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
const CONSUMED_TABS: { tab: string; consumer: string }[] = [
  { tab: 'I. 總表（易讀版）', consumer: 'tools/transform-company-data.ts' },
  { tab: 'I. 總表（進階版）', consumer: 'tools/transform-company-data.ts' },
  { tab: 'I. 總表各欄數值分級', consumer: 'tools/transform-company-data.ts' },
  { tab: 'II. 公司總表（原始值）', consumer: 'tools/transform-company-data.ts' },
  { tab: 'IV. 企業縣市排放絕對值（公式）', consumer: 'tools/analyze-regional-emissions.ts (standalone, not in build)' },
  { tab: 'VIII. 歷年燃煤數據', consumer: 'tools/transform-coal-usage-data.ts' },
  { tab: 'XII. 基金排碳量資訊', consumer: 'tools/transform-fund-data.ts' },
  { tab: '排碳大戶表_Data', consumer: 'tools/transform-company-data.ts' },
  { tab: '雷達圖_Data', consumer: 'tools/transform-company-data.ts' },
  { tab: '溫室氣體排放', consumer: 'tools/transform-trend-data.ts' },
  { tab: '能源消耗', consumer: 'tools/transform-trend-data.ts' },
  { tab: 'VI. 所有基金與排碳大戶對照', consumer: 'tools/transform-fund-data.ts' },
];

// 工廠縣市排放歷年 SOT — factory-level emissions by year and county.
// Powers the regional emission cards (currently filtered to ROC 113 / 2024 in
// the transform). The tab is named "原始檔（勿動）" upstream; we rename to a
// descriptive CSV.
const FACTORY_SOT_SPREADSHEET_ID = '125IPdMEUeLGzOF95ga3wsGV3jhP4J5wqbrIQt9KGjI4';
const FACTORY_SOT_TAB = '原始檔（勿動）';
const FACTORY_SOT_CSV_NAME = '工廠縣市排放_歷年.csv';

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

    logger.info(`Downloading ${CONSUMED_TABS.length} whitelisted Sheet B tabs`);

    // Create raw-data directory if it doesn't exist
    try {
      mkdirSync(RAW_DATA_DIR, { recursive: true });
      logger.info(`Output directory: ${RAW_DATA_DIR}`);
    } catch (error) {
      logger.error('Failed to create output directory', error);
      throw error;
    }

    // Download data from each whitelisted tab
    let successCount = 0;
    let failureCount = 0;

    for (const { tab, consumer } of CONSUMED_TABS) {
      try {
        logger.info(`Fetching tab: "${tab}" (consumed by ${consumer})`);

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: tab,
        });

        const values = response.data.values;

        if (!values || values.length === 0) {
          logger.info(`Tab "${tab}" is empty, skipping...`);
          continue;
        }

        // Convert to CSV
        const csv = arrayToCSV(values);

        // Use tab name as filename (UTF-8 encoding supports non-ASCII characters)
        const fileName = `${tab}.csv`;
        const filePath = join(RAW_DATA_DIR, fileName);

        // Write CSV file with UTF-8 encoding
        writeFileSync(filePath, csv, 'utf-8');

        logger.success(
          `Saved "${tab}" to ${fileName} (${values.length} rows, ${values[0]?.length || 0} columns)`
        );
        successCount++;
      } catch (error) {
        logger.error(`Failed to download tab "${tab}"`, error);
        failureCount++;
      }
    }

    // Fetch factory-level region SOT (best-effort; non-fatal on failure)
    logger.info(`Fetching factory SOT tab "${FACTORY_SOT_TAB}" from ${FACTORY_SOT_SPREADSHEET_ID}`);
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: FACTORY_SOT_SPREADSHEET_ID,
        range: FACTORY_SOT_TAB,
      });
      const values = response.data.values;
      if (values && values.length > 0) {
        const csv = arrayToCSV(values);
        const filePath = join(RAW_DATA_DIR, FACTORY_SOT_CSV_NAME);
        writeFileSync(filePath, csv, 'utf-8');
        logger.success(
          `Saved factory SOT to ${FACTORY_SOT_CSV_NAME} (${values.length} rows, ${values[0]?.length || 0} columns)`
        );
      } else {
        logger.info('Factory SOT tab is empty, skipping');
      }
    } catch (error) {
      logger.info(
        `Could not refresh factory SOT (likely the sheet is not public to this API key). Existing CSV is retained.`
      );
      logger.info(`  ${error instanceof Error ? error.message : String(error)}`);
    }

    // Summary
    logger.info('='.repeat(60));
    logger.success(`Successfully downloaded: ${successCount} sheets`);
    if (failureCount > 0) {
      logger.error(`Failed to download: ${failureCount} sheets`);
    }
    logger.logDuration();
    logger.info('='.repeat(60));

    // Exit with error code if any failures
    if (failureCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    logger.error('Fatal error during data download', error);
    process.exit(1);
  }
}

// Run the script
downloadRawData();
