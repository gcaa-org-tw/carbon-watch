import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CompanyEmissions {
  company: string;
  regions: Record<string, number>;
}

function parseCSV(filePath: string): CompanyEmissions[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());
  
  const companies: CompanyEmissions[] = [];
  
  // Parse each company row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;
    
    const company = values[0];
    const regions: Record<string, number> = {};
    
    // Parse regional emissions (skip "全台" at index 1)
    for (let j = 2; j < values.length && j < headers.length; j++) {
      const regionName = headers[j];
      const emissionStr = values[j].replace(/,/g, '').trim();
      const emission = parseFloat(emissionStr) || 0;
      
      if (emission > 0) {
        regions[regionName] = emission;
      }
    }
    
    companies.push({ company, regions });
  }
  
  return companies;
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
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

function analyzeEmissions(companies: CompanyEmissions[]) {
  console.log('=== 問題一：企業最多在幾個縣市有排放量 > 0 ===\n');
  
  let maxRegions = 0;
  let maxCompany = '';
  
  companies.forEach(({ company, regions }) => {
    const regionCount = Object.keys(regions).length;
    if (regionCount > maxRegions) {
      maxRegions = regionCount;
      maxCompany = company;
    }
  });
  
  console.log(`最多縣市數：${maxRegions}`);
  console.log(`企業名稱：${maxCompany}\n`);
  
  // Show distribution
  const distribution: Record<number, number> = {};
  companies.forEach(({ regions }) => {
    const count = Object.keys(regions).length;
    distribution[count] = (distribution[count] || 0) + 1;
  });
  
  console.log('企業分布（依據排放縣市數量）：');
  Object.keys(distribution)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(count => {
      console.log(`  ${count} 個縣市：${distribution[parseInt(count)]} 家企業`);
    });
  
  console.log('\n=== 問題二：前 N 名縣市的最低排放量覆蓋率 ===\n');
  
  // Calculate coverage for each company
  const coverageByTopN: Record<number, number[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  };
  
  companies.forEach(({ regions }) => {
    const regionEmissions = Object.entries(regions);
    if (regionEmissions.length === 0) return;
    
    // Sort by emission descending
    regionEmissions.sort((a, b) => b[1] - a[1]);
    
    const totalEmission = regionEmissions.reduce((sum, [_, val]) => sum + val, 0);
    
    // Calculate cumulative coverage for top 1-5 regions
    let cumulative = 0;
    for (let topN = 1; topN <= 5 && topN <= regionEmissions.length; topN++) {
      cumulative += regionEmissions[topN - 1][1];
      const coverage = (cumulative / totalEmission) * 100;
      coverageByTopN[topN].push(coverage);
    }
  });
  
  // Find minimum coverage for each top N
  console.log('前 N 名縣市的最低覆蓋率：\n');
  for (let topN = 1; topN <= 5; topN++) {
    const coverages = coverageByTopN[topN];
    if (coverages.length > 0) {
      const minCoverage = Math.min(...coverages);
      const maxCoverage = Math.max(...coverages);
      const avgCoverage = coverages.reduce((a, b) => a + b, 0) / coverages.length;
      
      console.log(`前 ${topN} 名縣市：`);
      console.log(`  最低覆蓋率：${minCoverage.toFixed(2)}%`);
      console.log(`  最高覆蓋率：${maxCoverage.toFixed(2)}%`);
      console.log(`  平均覆蓋率：${avgCoverage.toFixed(2)}%`);
      console.log(`  分析企業數：${coverages.length}`);
      console.log('');
    }
  }
  
  // Show detailed example
  console.log('\n=== 範例：台灣中油股份有限公司 ===\n');
  const exampleCompany = companies.find(c => c.company === '台灣中油股份有限公司');
  if (exampleCompany) {
    const regionEmissions = Object.entries(exampleCompany.regions);
    regionEmissions.sort((a, b) => b[1] - a[1]);
    
    const total = regionEmissions.reduce((sum, [_, val]) => sum + val, 0);
    
    console.log('各縣市排放量（依排放量排序）：');
    let cumulative = 0;
    regionEmissions.forEach(([region, emission], idx) => {
      cumulative += emission;
      const coverage = (cumulative / total) * 100;
      console.log(`  前 ${idx + 1} 名：${region} - ${emission.toLocaleString()} 公噸 (累計覆蓋率 ${coverage.toFixed(2)}%)`);
    });
  }
}

function analyzeTop10Companies(companies: CompanyEmissions[]) {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('\n=== 前 10 大排放企業分析 ===\n');
  
  // Calculate total emissions for each company and sort
  const companiesWithTotal = companies.map(({ company, regions }) => {
    const total = Object.values(regions).reduce((sum, val) => sum + val, 0);
    return { company, regions, total };
  });
  
  companiesWithTotal.sort((a, b) => b.total - a.total);
  const top10 = companiesWithTotal.slice(0, 10);
  
  console.log('前 10 大排放企業（依總排放量排序）：\n');
  top10.forEach((c, idx) => {
    const regionCount = Object.keys(c.regions).length;
    console.log(`${idx + 1}. ${c.company}`);
    console.log(`   總排放量：${c.total.toLocaleString()} 公噸 CO2e`);
    console.log(`   排放縣市數：${regionCount}`);
  });
  
  console.log('\n=== 問題一（前 10 大企業）：最多排放縣市數 ===\n');
  
  let maxRegions = 0;
  let maxCompany = '';
  
  top10.forEach(({ company, regions }) => {
    const regionCount = Object.keys(regions).length;
    if (regionCount > maxRegions) {
      maxRegions = regionCount;
      maxCompany = company;
    }
  });
  
  console.log(`最多縣市數：${maxRegions}`);
  console.log(`企業名稱：${maxCompany}\n`);
  
  // Show distribution for top 10
  const distribution: Record<number, number> = {};
  top10.forEach(({ regions }) => {
    const count = Object.keys(regions).length;
    distribution[count] = (distribution[count] || 0) + 1;
  });
  
  console.log('前 10 大企業分布（依排放縣市數量）：');
  Object.keys(distribution)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(count => {
      console.log(`  ${count} 個縣市：${distribution[parseInt(count)]} 家企業`);
    });
  
  console.log('\n=== 問題二（前 10 大企業）：前 N 名縣市的最低排放量覆蓋率 ===\n');
  
  // Calculate coverage for top 10 companies
  const coverageByTopN: Record<number, number[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  };
  
  top10.forEach(({ regions }) => {
    const regionEmissions = Object.entries(regions);
    if (regionEmissions.length === 0) return;
    
    // Sort by emission descending
    regionEmissions.sort((a, b) => b[1] - a[1]);
    
    const totalEmission = regionEmissions.reduce((sum, [_, val]) => sum + val, 0);
    
    // Calculate cumulative coverage for top 1-5 regions
    let cumulative = 0;
    for (let topN = 1; topN <= 5 && topN <= regionEmissions.length; topN++) {
      cumulative += regionEmissions[topN - 1][1];
      const coverage = (cumulative / totalEmission) * 100;
      coverageByTopN[topN].push(coverage);
    }
  });
  
  // Find minimum coverage for each top N
  console.log('前 N 名縣市的最低覆蓋率（僅前 10 大企業）：\n');
  for (let topN = 1; topN <= 5; topN++) {
    const coverages = coverageByTopN[topN];
    if (coverages.length > 0) {
      const minCoverage = Math.min(...coverages);
      const maxCoverage = Math.max(...coverages);
      const avgCoverage = coverages.reduce((a, b) => a + b, 0) / coverages.length;
      
      console.log(`前 ${topN} 名縣市：`);
      console.log(`  最低覆蓋率：${minCoverage.toFixed(2)}%`);
      console.log(`  最高覆蓋率：${maxCoverage.toFixed(2)}%`);
      console.log(`  平均覆蓋率：${avgCoverage.toFixed(2)}%`);
      console.log(`  分析企業數：${coverages.length}`);
      console.log('');
    }
  }
  
  // Show detailed breakdown for each top 10 company
  console.log('\n=== 前 10 大企業各縣市排放詳細資訊 ===\n');
  top10.forEach(({ company, regions, total }, idx) => {
    const regionEmissions = Object.entries(regions);
    regionEmissions.sort((a, b) => b[1] - a[1]);
    
    console.log(`${idx + 1}. ${company}（總排放量：${total.toLocaleString()} 公噸）`);
    let cumulative = 0;
    regionEmissions.forEach(([region, emission], regionIdx) => {
      cumulative += emission;
      const coverage = (cumulative / total) * 100;
      const percentage = (emission / total) * 100;
      console.log(`   前 ${regionIdx + 1} 名：${region} - ${emission.toLocaleString()} 公噸（佔比 ${percentage.toFixed(2)}%，累計 ${coverage.toFixed(2)}%）`);
    });
    console.log('');
  });
}

// Main execution
const csvPath = path.join(__dirname, '../raw-data/IV. 企業縣市排放絕對值（公式）.csv');
const companies = parseCSV(csvPath);

console.log(`已載入 ${companies.length} 家企業\n`);
console.log('='.repeat(70));
console.log('\n');

analyzeEmissions(companies);
analyzeTop10Companies(companies);
