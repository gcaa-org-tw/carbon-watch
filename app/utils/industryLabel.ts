export const industryLabel = (industry: string, subIndustry?: string): string =>
  subIndustry ? `${industry}（${subIndustry}）` : industry
