/**
 * Coal Usage Data Transformer
 *
 * Reads the fuel-season company file and the steel coal file
 * (merged in tools/lib/coal-source.ts) and outputs a JSON map keyed by 公司全名.
 *
 * ## Usage
 *
 * ```bash
 * npm run transform-coal-usage-data
 * ```
 *
 * ## Input
 *
 * - **Source**: `raw-data/用煤者_公司.csv`
 *   Columns: 公司, 特定集團, 產業別認定, 2020 .. 2025, 比較, 2026, 歷年總和(驗算用)
 * - **Steel override**: `raw-data/鋼鐵業用煤_歷年.csv` replaces the fuel-file rows of
 *   steel companies (中鋼, 中龍)
 *
 * ## Output
 *
 * ### Coal Usage Map (`app/assets/data/coal-usage-map.json`)
 *
 * ```typescript
 * Record<string, Array<{ year: number; value: number }>>
 * ```
 *
 * Keyed by 公司全名 (full company name, 臺→台 normalized to match hub). Each
 * entry is an array of yearly data points sorted by year ascending, with only
 * non-zero values included.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { loadCoalByCompany } from './lib/coal-source.js';
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
 * Main transformation function
 */
async function transformCoalUsageData() {
  const logger = new Logger();

  try {
    logger.info('Starting coal usage data transformation');

    // 1. Load company coal usage (fuel file + steel override)
    const coalByCompany = loadCoalByCompany(RAW_DATA_DIR);
    logger.info(`Loaded ${coalByCompany.size} companies`);

    // 2. Skip pre-2021: 2020 only covers ~46% of coal-using companies in the source,
    //    causing inconsistent chart start points across companies.
    const MIN_YEAR = 2023;

    // 3. Transform to map keyed by 公司
    const coalUsageMap: Record<string, Array<{ year: number; value: number }>> = {};

    let processedCount = 0;

    for (const [companyName, years] of coalByCompany) {
      const dataPoints: Array<{ year: number; value: number }> = [];

      for (const [year, value] of years) {
        if (year >= MIN_YEAR && value > 0) {
          dataPoints.push({ year, value });
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
    logger.info(`Total companies loaded: ${coalByCompany.size}`);
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
