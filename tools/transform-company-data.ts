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
 * ## Implementation Notes
 * 
 * - Uses CSV parser that handles quoted fields and special characters
 * - Merges basic and advanced data by company name (公司)
 * - Logs all operations for transparency and traceability
 * - Follows the data source roadmap (Phase 1, item 3)
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
    const companyList = mergeCompanyData(basicData, advancedData);
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
    logger.logDuration();
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('Fatal error during data transformation', error);
    process.exit(1);
  }
}

// Run the script
transformCompanyData();
