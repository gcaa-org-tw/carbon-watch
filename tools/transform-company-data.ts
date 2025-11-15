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
 * Array of unique 代表縣市 values, ordered by geographic location (north to south, west to east).
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
 * Add 代表縣市 data to company list
 */
function addRepresentativeCity(
  companyList: Record<string, string>[],
  allCompanyData: Record<string, string>[],
  companyDetailData: Record<string, string>[],
  logger: Logger
): Record<string, string>[] {
  logger.info('Step 3: Adding 代表縣市, 事業統編, and 公司全名 data');
  
  // Create lookup maps
  // Map 1: name_abbr -> { tax_code, name }
  const nameAbbrToCompany = new Map<string, { taxCode: string; fullName: string }>();
  for (const company of allCompanyData) {
    const nameAbbr = company['name_abbr']?.trim();
    const taxCode = company['tax_code']?.trim();
    const fullName = company['name']?.trim();
    if (nameAbbr && taxCode && fullName) {
      nameAbbrToCompany.set(nameAbbr, { taxCode, fullName });
    }
  }
  logger.info(`Loaded ${nameAbbrToCompany.size} company mappings from all-company.csv`);
  
  // Map 2: tax_code -> 代表縣市
  const taxCodeToCity = new Map<string, string>();
  for (const detail of companyDetailData) {
    const taxCode = detail['事業統編']?.trim();
    const city = detail['代表縣市']?.trim();
    if (taxCode && city) {
      taxCodeToCity.set(taxCode, city);
    }
  }
  logger.info(`Loaded ${taxCodeToCity.size} city mappings from II. 公司總表（原始值）.csv`);
  
  // Add 代表縣市, 事業統編, and 公司全名 to each company
  let successCount = 0;
  const failedCompanies: string[] = [];
  
  for (const company of companyList) {
    const companyName = company['公司'];
    
    // Step 1: Get tax_code and full name from all-company using name_abbr
    const companyInfo = nameAbbrToCompany.get(companyName);
    
    if (!companyInfo) {
      failedCompanies.push(companyName);
      logger.info(`⚠️  Cannot find tax_code for company: ${companyName}`);
      continue;
    }
    
    const { taxCode, fullName } = companyInfo;
    
    // Step 2: Get 代表縣市 using tax_code
    const city = taxCodeToCity.get(taxCode);
    
    if (!city) {
      failedCompanies.push(companyName);
      logger.info(`⚠️  Cannot find 代表縣市 for company: ${companyName} (tax_code: ${taxCode})`);
      // Still add tax_code and full name even if city is not found
      company['事業統編'] = taxCode;
      company['公司全名'] = fullName;
      continue;
    }
    
    // Add all fields to company record
    company['代表縣市'] = city;
    company['事業統編'] = taxCode;
    company['公司全名'] = fullName;
    successCount++;
  }
  
  logger.success(`Successfully added 代表縣市 for ${successCount}/${companyList.length} companies`);
  
  if (failedCompanies.length > 0) {
    logger.info(`⚠️  Failed to map ${failedCompanies.length} companies:`);
    failedCompanies.forEach(name => logger.info(`  - ${name}`));
  }
  
  return companyList;
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

    // 3. Load all-company.csv and company detail data
    const allCompanyCsvPath = join(RAW_DATA_DIR, 'all-company.csv');
    logger.info(`Reading all-company data from: ${allCompanyCsvPath}`);
    const allCompanyCsvContent = readFileSync(allCompanyCsvPath, 'utf-8');
    const allCompanyData = parseCSV(allCompanyCsvContent);
    logger.info(`Parsed ${allCompanyData.length} records from all-company.csv`);

    const companyDetailCsvPath = join(RAW_DATA_DIR, 'II. 公司總表（原始值）.csv');
    logger.info(`Reading company detail data from: ${companyDetailCsvPath}`);
    const companyDetailCsvContent = readFileSync(companyDetailCsvPath, 'utf-8');
    const companyDetailData = parseCSV(companyDetailCsvContent);
    logger.info(`Parsed ${companyDetailData.length} records from II. 公司總表（原始值）.csv`);

    // Add 代表縣市 to company list
    companyList = addRepresentativeCity(companyList, allCompanyData, companyDetailData, logger);

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
    logger.info('Step 4: Generating region list');
    const regionSet = new Set<string>();
    companyList.forEach(company => {
      const region = company['代表縣市'];
      if (region && region.trim()) {
        regionSet.add(region.trim());
      }
    });
    
    // Manual ordering: north to south, west to east
    const taiwanRegionOrder = [
      '基隆市',
      '臺北市',
      '新北市',
      '桃園市',
      '新竹市',
      '新竹縣',
      '苗栗縣',
      '臺中市',
      '彰化縣',
      '雲林縣',
      '嘉義市',
      '嘉義縣',
      '臺南市',
      '高雄市',
      '屏東縣',
      '南投縣',
      '宜蘭縣',
      '花蓮縣',
      '臺東縣',
      '澎湖縣',
      '金門縣',
      '連江縣',
    ];
    
    const regionList = taiwanRegionOrder.filter(region => regionSet.has(region));
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
      .map(([industry, count]) => ({ industry, count }));
    
    logger.info(`Found ${industryList.length} unique industries`);
    
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
