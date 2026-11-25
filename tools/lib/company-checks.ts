export function assertCompanyTaxIds(companies: Record<string, string>[]) {
  const missing: string[] = [];
  const malformed: string[] = [];
  const namesByTaxId = new Map<string, string[]>();
  companies.forEach(company => {
    const name = company['公司'];
    const taxId = company['事業統編'];
    if (!taxId) {
      missing.push(name);
      return;
    }
    if (!/^\d{8}$/.test(taxId)) malformed.push(`${name} (${taxId})`);
    namesByTaxId.set(taxId, [...(namesByTaxId.get(taxId) ?? []), name]);
  });
  const duplicated = [...namesByTaxId]
    .filter(([, names]) => names.length > 1)
    .map(([taxId, names]) => `${taxId}: ${names.join(' / ')}`);
  if (missing.length > 0 || malformed.length > 0 || duplicated.length > 0) {
    throw new Error(
      `事業統編 check failed ` +
        `(missing: ${missing.join(', ') || 'none'}; ` +
        `not 8 digits: ${malformed.join(', ') || 'none'}; ` +
        `duplicated: ${duplicated.join('; ') || 'none'})`
    );
  }
}
