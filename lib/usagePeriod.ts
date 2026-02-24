export type UsagePeriod = {
  month: number;
  year: number;
};

/**
 * Returns the current usage period in UTC (month + year).
 * Keeps all plan usage queries aligned to UTC month boundaries.
 */
export function getCurrentUsagePeriod(date: Date = new Date()): UsagePeriod {
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}
