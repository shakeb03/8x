// Canadian sales tax (combined GST/HST/PST) by province, used for the
// estimated tax line at checkout. Rates are simplified to one combined rate.

export type Province = { code: string; name: string; rate: number };

export const PROVINCES: Province[] = [
  { code: "AB", name: "Alberta", rate: 0.05 },
  { code: "BC", name: "British Columbia", rate: 0.12 },
  { code: "MB", name: "Manitoba", rate: 0.12 },
  { code: "NB", name: "New Brunswick", rate: 0.15 },
  { code: "NL", name: "Newfoundland and Labrador", rate: 0.15 },
  { code: "NS", name: "Nova Scotia", rate: 0.14 },
  { code: "NT", name: "Northwest Territories", rate: 0.05 },
  { code: "NU", name: "Nunavut", rate: 0.05 },
  { code: "ON", name: "Ontario", rate: 0.13 },
  { code: "PE", name: "Prince Edward Island", rate: 0.15 },
  { code: "QC", name: "Quebec", rate: 0.14975 },
  { code: "SK", name: "Saskatchewan", rate: 0.11 },
  { code: "YT", name: "Yukon", rate: 0.05 },
];

export function taxRate(provinceCode: string): number {
  return PROVINCES.find((p) => p.code === provinceCode)?.rate ?? 0;
}
