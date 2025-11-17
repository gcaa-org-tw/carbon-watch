/**
 * Region Map Data Transformer
 * 
 * This script implements Phase 1 of the data source roadmap:
 * - Reads raw CSV files from raw-data/
 * - Transforms data into unified JSON schema for UI layer
 * - Outputs to app/assets/data/ directory
 * 
 * ## Usage
 * 
 * ```bash
 * npm run transform-region-map-data
 * ```
 * 
 * ## Input
 * 
 * - **Source**: `raw-data/IV. 企業縣市排放絕對值（公式）.csv`
 * - **Format**: CSV with company names in column A and region emissions in columns C-T
 * 
 * ## Output
 * 
 * ### Region Emission List (`app/assets/data/region-emission-list.json`)
 * 
 * JSON array containing region emission statistics, sorted by total emissions (descending):
 * 
 * ```typescript
 * interface RegionEmission {
 *   縣市: string;              // Region name
 *   總排放量: number;          // Total emissions in tonnes CO2e
 *   總排放量佔比: number;      // Percentage of total emissions
 *   企業數: number;            // Number of companies in this region
 * }
 * ```
 * 
 * ## Data Transformations
 * 
 * 1. **總排放量 (Total Emissions)**
 *    - Source: Sum of all company emissions for each region
 *    - Removes commas from numbers before parsing
 *    - Unit: Tonnes CO2e
 * 
 * 2. **企業數 (Company Count)**
 *    - Counts companies with non-zero emissions in each region
 * 
 * 3. **總排放量佔比 (Emission Percentage)**
 *    - Calculation: (Region emissions / Total emissions) * 100
 *    - Unit: Percentage (rounded to 2 decimal places)
 * 
 * 4. **Sorting**
 *    - Regions are sorted by total emissions in descending order
 * 
 * ## Implementation Notes
 * 
 * - Uses CSV parser that handles quoted fields and special characters
 * - Removes thousand separators (,) when parsing numbers
 * - Filters out regions with zero emissions
 * - Logs all operations for transparency and traceability
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
 * Region emission data interface
 */
interface RegionEmission {
  縣市: string;
  總排放量: number;
  總排放量佔比: number;
  企業數: number;
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
 * Parse a number string from CSV (handles commas)
 */
function parseNumber(value: string): number {
  if (!value || value === '') return 0;
  // Remove commas and whitespace
  const cleaned = value.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Transform region emission data
 * Groups by region, sums emissions, counts companies, and sorts by total emissions
 */
function transformRegionEmissions(rawData: Record<string, string>[]): RegionEmission[] {
  if (rawData.length === 0) {
    return [];
  }

  // Get all region column names (excluding first two columns: company name and total)
  const firstRow = rawData[0];
  const allColumns = Object.keys(firstRow);
  
  // Region columns start from index 2 (skip company name column and 全台 column)
  const regionColumns = allColumns.slice(2);
  
  // Initialize data structure for aggregation
  const regionMap = new Map<string, { totalEmissions: number; companyCount: number }>();
  
  // Initialize all regions with zero values
  regionColumns.forEach(region => {
    regionMap.set(region, { totalEmissions: 0, companyCount: 0 });
  });
  
  // Process each company row
  rawData.forEach(row => {
    regionColumns.forEach(region => {
      const emissions = parseNumber(row[region]);
      if (emissions > 0) {
        const current = regionMap.get(region)!;
        current.totalEmissions += emissions;
        current.companyCount += 1;
      }
    });
  });
  
  // Calculate total emissions across all regions
  let totalEmissions = 0;
  regionMap.forEach((data) => {
    if (data.totalEmissions > 0) {
      totalEmissions += data.totalEmissions;
    }
  });
  
  // Convert map to array and filter out regions with zero emissions
  const regionList: RegionEmission[] = [];
  regionMap.forEach((data, region) => {
    if (data.totalEmissions > 0) {
      const emissions = Math.round(data.totalEmissions);
      const percentage = totalEmissions > 0 
        ? Math.round((data.totalEmissions / totalEmissions) * 10000) / 100 
        : 0;
      
      regionList.push({
        縣市: region,
        總排放量: emissions,
        總排放量佔比: percentage,
        企業數: data.companyCount,
      });
    }
  });
  
  // Sort by total emissions in descending order
  regionList.sort((a, b) => b.總排放量 - a.總排放量);
  
  return regionList;
}

/**
 * Main transformation function
 */
async function transformRegionMapData() {
  const logger = new Logger();

  try {
    logger.info('Starting region map data transformation');
    logger.info('='.repeat(60));

    // Read CSV file
    const csvPath = join(RAW_DATA_DIR, 'IV. 企業縣市排放絕對值（公式）.csv');
    logger.info(`Reading CSV from: ${csvPath}`);
    
    const csvContent = readFileSync(csvPath, 'utf-8');
    const rawData = parseCSV(csvContent);
    
    logger.info(`Parsed ${rawData.length} company records from CSV`);

    logger.info('='.repeat(60));

    // Transform data
    const regionList = transformRegionEmissions(rawData);
    logger.success(`Transformed data for ${regionList.length} regions`);

    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true });
    logger.info(`Output directory: ${OUTPUT_DIR}`);

    // Write output JSON
    const outputPath = join(OUTPUT_DIR, 'region-emission-list.json');
    writeFileSync(
      outputPath,
      JSON.stringify(regionList, null, 2),
      'utf-8'
    );
    logger.success(`Saved region emission list to: region-emission-list.json`);

    // Log sample of transformed data
    logger.info('='.repeat(60));
    logger.info('Sample of region emission data (top 5 regions):');
    console.log(JSON.stringify(regionList.slice(0, 5), null, 2));

    // Log statistics
    const totalEmissions = regionList.reduce((sum, region) => sum + region.總排放量, 0);
    const totalCompanies = regionList.reduce((sum, region) => sum + region.企業數, 0);
    
    logger.info('='.repeat(60));
    logger.info('Statistics:');
    logger.info(`  Total regions: ${regionList.length}`);
    logger.info(`  Total emissions: ${totalEmissions.toLocaleString()} tonnes CO2e`);
    logger.info(`  Total company-region entries: ${totalCompanies}`);
    logger.info(`  Top region: ${regionList[0]?.縣市} (${regionList[0]?.總排放量.toLocaleString()} tonnes CO2e)`);

    // Summary
    logger.info('='.repeat(60));
    logger.success('Data transformation completed successfully');
    logger.logDuration();
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('Fatal error during data transformation', error);
    process.exit(1);
  }
}

// Run the script
transformRegionMapData();
