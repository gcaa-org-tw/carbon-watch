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

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration from environment variables
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// Output directory for raw CSV files
const RAW_DATA_DIR = join(__dirname, '..', 'raw-data');

/**
 * Logger for transparency and traceability
 */
class Logger {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  info(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`);
  }

  success(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[SUCCESS] ${timestamp} - ${message}`);
  }

  error(message: string, error?: unknown) {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`);
    if (error) {
      console.error(error);
    }
  }

  logDuration() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.info(`Total execution time: ${duration}s`);
  }
}

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

    // Get spreadsheet metadata to retrieve sheet names
    logger.info('Fetching spreadsheet metadata...');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetNames = spreadsheet.data.sheets?.map(
      sheet => sheet.properties?.title
    ).filter(Boolean) as string[];

    if (!sheetNames || sheetNames.length === 0) {
      throw new Error('No sheets found in the spreadsheet');
    }

    logger.info(`Found ${sheetNames.length} sheets: ${sheetNames.join(', ')}`);

    // Create raw-data directory if it doesn't exist
    try {
      mkdirSync(RAW_DATA_DIR, { recursive: true });
      logger.info(`Output directory: ${RAW_DATA_DIR}`);
    } catch (error) {
      logger.error('Failed to create output directory', error);
      throw error;
    }

    // Download data from each sheet
    let successCount = 0;
    let failureCount = 0;

    for (const sheetName of sheetNames) {
      try {
        logger.info(`Fetching data from sheet: "${sheetName}"`);

        // Fetch all data from the sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: sheetName,
        });

        const values = response.data.values;

        if (!values || values.length === 0) {
          logger.info(`Sheet "${sheetName}" is empty, skipping...`);
          continue;
        }

        // Convert to CSV
        const csv = arrayToCSV(values);

        // Use sheet name as filename (UTF-8 encoding supports non-ASCII characters)
        const fileName = `${sheetName}.csv`;
        const filePath = join(RAW_DATA_DIR, fileName);

        // Write CSV file with UTF-8 encoding
        writeFileSync(filePath, csv, 'utf-8');

        logger.success(
          `Saved "${sheetName}" to ${fileName} (${values.length} rows, ${values[0]?.length || 0} columns)`
        );
        successCount++;
      } catch (error) {
        logger.error(`Failed to download sheet "${sheetName}"`, error);
        failureCount++;
      }
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
