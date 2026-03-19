/**
 * Coal Usage Data Transformer
 *
 * Reads raw CSV from raw-data/VIII. 歷年燃煤數據.csv
 * and outputs a JSON map keyed by 事業統編 (tax code).
 *
 * ## Usage
 *
 * ```bash
 * npm run transform-coal-usage-data
 * ```
 *
 * ## Input
 *
 * - **Source**: `raw-data/VIII. 歷年燃煤數據.csv`
 *   Columns: 年度, 公司, 事業統編, 統編補0, 行業分類, 行業大類, 2020, 2021, 2022, 2023, 2024, 2025
 *
 * ## Output
 *
 * ### Coal Usage Map (`app/assets/data/coal-usage-map.json`)
 *
 * ```typescript
 * Record<string, Array<{ year: number; value: number }>>
 * ```
 *
 * Keyed by 公司 (company name). Each entry is an array of yearly data points
 * sorted by year ascending, with only non-zero values included.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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
 * Main transformation function
 */
async function transformCoalUsageData() {
  const logger = new Logger();

  try {
    logger.info('Starting coal usage data transformation');

    // 1. Load CSV
    const csvPath = join(RAW_DATA_DIR, 'VIII. 歷年燃煤數據.csv');
    logger.info(`Reading data from: ${csvPath}`);
    const csvContent = readFileSync(csvPath, 'utf-8');
    const rawData = parseCSV(csvContent);
    logger.info(`Parsed ${rawData.length} records`);

    // 2. Detect year columns from CSV headers (any header that is a 4-digit number)
    const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
    const yearColumns = headers.filter(h => /^\d{4}$/.test(h)).sort();
    logger.info(`Detected year columns: ${yearColumns.join(', ')}`);

    // 3. Transform to map keyed by 公司
    const coalUsageMap: Record<string, Array<{ year: number; value: number }>> = {};

    let processedCount = 0;
    let skippedCount = 0;

    for (const row of rawData) {
      const companyName = row['公司']?.trim();

      if (!companyName) {
        skippedCount++;
        continue;
      }

      const dataPoints: Array<{ year: number; value: number }> = [];

      for (const yearCol of yearColumns) {
        const value = parseNumber(row[yearCol]);
        if (value !== undefined && value > 0) {
          dataPoints.push({ year: parseInt(yearCol), value });
        }
      }

      if (dataPoints.length > 0) {
        // Sort by year ascending
        dataPoints.sort((a, b) => a.year - b.year);
        coalUsageMap[companyName] = dataPoints;
        processedCount++;
      }
    }

    logger.success(`Processed ${processedCount} companies with coal usage data`);
    if (skippedCount > 0) {
      logger.info(`Skipped ${skippedCount} rows (missing 公司)`);
    }

    // 3. Write output
    mkdirSync(OUTPUT_DIR, { recursive: true });

    const outputPath = join(OUTPUT_DIR, 'coal-usage-map.json');
    writeFileSync(
      outputPath,
      JSON.stringify(coalUsageMap, null, 2),
      'utf-8'
    );
    logger.success(`Saved coal usage map to: coal-usage-map.json`);

    // Summary
    logger.info('='.repeat(60));
    logger.success('Coal usage data transformation completed');
    logger.info(`Total records in CSV: ${rawData.length}`);
    logger.info(`Companies with coal data: ${processedCount}`);
    logger.info(`Total entries in map: ${Object.keys(coalUsageMap).length}`);
    logger.logDuration();
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('Fatal error during coal usage data transformation', error);
    process.exit(1);
  }
}

// Run the script
transformCoalUsageData();
