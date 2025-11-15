/**
 * Fund Data Transformer
 * 
 * This script implements Phase 1 (item 3) of the data source roadmap:
 * - Reads raw CSV files from raw-data/
 * - Transforms data into unified JSON schema for UI layer
 * - Outputs to app/assets/data/ directory
 * 
 * ## Usage
 * 
 * ```bash
 * npm run transform-fund-data
 * ```
 * 
 * ## Input
 * 
 * - **Source**: `raw-data/XII. 基金排碳量資訊.csv`
 * - **Format**: CSV with Chinese headers
 * 
 * ## Output
 * 
 * ### Fund List (`app/assets/data/fund-list.json`)
 * 
 * JSON array containing fund information:
 * 
 * ```typescript
 * interface FundData {
 *   基金代號: string;           // Fund code (e.g., "0050")
 *   基金名稱: string;           // Fund name
 *   總市值: number;            // Total market value in million NTD
 *   排碳大戶家數: number;       // Number of high-emission companies
 *   排碳大戶佔比: number;       // Percentage of high-emission companies in portfolio
 *   排碳大戶總碳排量: number;   // Total carbon emissions from high-emission holdings
 *   使用燃煤家數: number;       // Number of coal-using companies
 * }
 * ```
 * 
 * ## Data Transformations
 * 
 * 1. **總市值 (Total Market Value)**
 *    - Source: `投資價值（萬）` in CSV
 *    - Calculation: `投資價值（萬）/ 100`
 *    - Unit: Million NTD
 * 
 * 2. **排碳大戶佔比 (High-Emission Company Ratio)**
 *    - Source: `排碳大戶家數` and `持股企業數` in CSV
 *    - Calculation: `(排碳大戶家數 / 持股企業數) * 100`
 *    - Unit: Percentage (rounded to 2 decimal places)
 * 
 * ## Implementation Notes
 * 
 * - Uses CSV parser that handles quoted fields and special characters
 * - Removes currency symbols ($) and thousand separators (,) when parsing numbers
 * - Logs all operations for transparency and traceability
 * - Follows the data source roadmap (Phase 1, item 3)
 * 
 * ## Future Enhancement
 * 
 * Phase 2 will add fund detail transformation with more granular company-level information.
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

/**
 * Fund data interface
 */
interface FundData {
  基金代號: string;
  基金名稱: string;
  總市值: number; // in million NTD
  排碳大戶家數: number;
  排碳大戶佔比: number; // percentage
  排碳大戶總碳排量: number;
  使用燃煤家數: number;
}

/**
 * Transform fund list data
 */
function transformFundList(rawData: Record<string, string>[]): FundData[] {
  return rawData.map(row => {
    const 投資價值萬 = parseNumber(row['投資價值（萬）']);
    const 持股企業數 = parseNumber(row['持股企業數']);
    const 排碳大戶家數 = parseNumber(row['排碳大戶家數']);
    
    return {
      基金代號: row['基金代號'] || '',
      基金名稱: row['基金名稱'] || '',
      總市值: Math.round(投資價值萬 / 100), // Convert 萬 to million
      排碳大戶家數,
      排碳大戶佔比: 持股企業數 > 0 ? Math.round((排碳大戶家數 / 持股企業數) * 10000) / 100 : 0, // Percentage with 2 decimal places
      排碳大戶總碳排量: parseNumber(row['大戶總碳排量']),
      使用燃煤家數: parseNumber(row['總燃煤企業數']),
    };
  });
}

/**
 * Main transformation function
 */
async function transformFundData() {
  const logger = new Logger();

  try {
    logger.info('Starting fund data transformation');

    // Read raw CSV file
    const csvPath = join(RAW_DATA_DIR, 'XII. 基金排碳量資訊.csv');
    logger.info(`Reading CSV from: ${csvPath}`);
    
    const csvContent = readFileSync(csvPath, 'utf-8');
    const rawData = parseCSV(csvContent);
    
    logger.info(`Parsed ${rawData.length} fund records from CSV`);

    // Transform fund list
    const fundList = transformFundList(rawData);
    logger.success(`Transformed ${fundList.length} fund records`);

    // Create output directory if it doesn't exist
    mkdirSync(OUTPUT_DIR, { recursive: true });
    logger.info(`Output directory: ${OUTPUT_DIR}`);

    // Write fund list JSON
    const fundListPath = join(OUTPUT_DIR, 'fund-list.json');
    writeFileSync(
      fundListPath,
      JSON.stringify(fundList, null, 2),
      'utf-8'
    );
    logger.success(`Saved fund list to: fund-list.json`);

    // Log sample of transformed data
    logger.info('Sample of transformed data (first 3 records):');
    console.log(JSON.stringify(fundList.slice(0, 3), null, 2));

    // Summary
    logger.info('='.repeat(60));
    logger.success('Data transformation completed successfully');
    logger.info(`Total funds processed: ${fundList.length}`);
    logger.logDuration();
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('Fatal error during data transformation', error);
    process.exit(1);
  }
}

// Run the script
transformFundData();
