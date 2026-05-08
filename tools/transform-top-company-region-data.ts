import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RAW_DATA_DIR = join(__dirname, '..', 'raw-data');
const ASSETS_DATA_DIR = join(__dirname, '..', 'app', 'assets', 'data');

interface Top10Company {
  公司: string;
  公司全名: string;
  [key: string]: string;
}

interface CompanyRegionEmission {
  公司全名: string;
  公司: string;
  全台排放量: number;
  全台佔比: number;
  縣市排放: Record<string, number>;
  排放縣市: string[];
}

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

function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

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

function parseNumber(value: string): number {
  if (!value || value === '') return 0;
  const cleaned = value.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Normalize company name: treat 臺 and 台 as equivalent
function normalizeName(name: string): string {
  return name.replace(/臺/g, '台');
}

async function transformTopCompanyRegionData() {
  const logger = new Logger();

  try {
    logger.info('Starting top company region data transformation');

    // Load top-10-companies.json
    const top10Path = join(ASSETS_DATA_DIR, 'top-10-companies.json');
    const top10Companies: Top10Company[] = JSON.parse(readFileSync(top10Path, 'utf-8'));
    logger.info(`Loaded ${top10Companies.length} top companies`);

    // Load and parse CSV
    const csvPath = join(RAW_DATA_DIR, 'IV. 企業縣市排放絕對值（公式）.csv');
    logger.info(`Reading CSV from: ${csvPath}`);
    const csvContent = readFileSync(csvPath, 'utf-8');
    const rawData = parseCSV(csvContent);
    logger.info(`Parsed ${rawData.length} company records from CSV`);

    // Get column names
    const firstRow = rawData[0];
    const allColumns = Object.keys(firstRow);
    const companyCol = allColumns[0]; // '於該縣市合計排放量(公噸CO2e)'
    const totalCol = '全台';
    const countyColumns = allColumns.slice(2); // all county columns

    // Calculate total Taiwan emissions across all companies
    const totalTaiwanEmissions = rawData.reduce((sum, row) => {
      return sum + parseNumber(row[totalCol]);
    }, 0);
    logger.info(`Total Taiwan emissions (all companies): ${totalTaiwanEmissions.toLocaleString()} tonnes`);

    // Build lookup map: normalized company name → CSV row
    const csvLookup = new Map<string, Record<string, string>>();
    rawData.forEach(row => {
      const name = normalizeName(row[companyCol]?.trim() ?? '');
      if (name) csvLookup.set(name, row);
    });

    // Transform each top-10 company
    const result: CompanyRegionEmission[] = [];

    for (const company of top10Companies) {
      const normalizedFullName = normalizeName(company['公司全名']);
      const csvRow = csvLookup.get(normalizedFullName);

      if (!csvRow) {
        logger.error(`Could not find CSV row for: ${company['公司全名']}`);
        // Still include with 0 data so we don't break the UI
        result.push({
          公司全名: company['公司全名'],
          公司: company['公司'],
          全台排放量: 0,
          全台佔比: 0,
          縣市排放: {},
          排放縣市: [],
        });
        continue;
      }

      const totalEmissions = parseNumber(csvRow[totalCol]);
      const percentage = totalTaiwanEmissions > 0
        ? Math.round((totalEmissions / totalTaiwanEmissions) * 1000) / 10
        : 0;

      const 縣市排放: Record<string, number> = {};
      const 排放縣市: string[] = [];

      for (const county of countyColumns) {
        const emissions = parseNumber(csvRow[county]);
        if (emissions > 0) {
          縣市排放[county] = Math.round(emissions);
          排放縣市.push(county);
        }
      }

      result.push({
        公司全名: company['公司全名'],
        公司: company['公司'],
        全台排放量: Math.round(totalEmissions),
        全台佔比: percentage,
        縣市排放,
        排放縣市,
      });

      logger.info(`  ${company['公司']}: ${totalEmissions.toLocaleString()} tonnes, ${percentage}% of Taiwan, ${排放縣市.length} counties`);
    }

    // Write output
    mkdirSync(ASSETS_DATA_DIR, { recursive: true });
    const outputPath = join(ASSETS_DATA_DIR, 'top-company-region-emissions.json');
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    logger.success(`Saved to: top-company-region-emissions.json`);
    logger.logDuration();

  } catch (error) {
    logger.error('Fatal error during transformation', error);
    process.exit(1);
  }
}

transformTopCompanyRegionData();
