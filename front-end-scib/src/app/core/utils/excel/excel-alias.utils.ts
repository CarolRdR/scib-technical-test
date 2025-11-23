import { EXCEL_ALIAS } from '../../constants/excel/excel-alias.constants';

type ExcelRow = Record<string, unknown>;
type AvailabilityTrueToken = (typeof EXCEL_ALIAS.availabilityTrue)[number];
type AvailabilityFalseToken = (typeof EXCEL_ALIAS.availabilityFalse)[number];

// Returns the first non-empty cell found using any of the provided aliases.
export const findValueByAliases = (row: ExcelRow, aliases: readonly string[]): unknown => {
  for (const key of aliases) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

// Shortcut for retrieving the "years" column using all known aliases.
export const findYearsValue = (row: ExcelRow): unknown => findValueByAliases(row, EXCEL_ALIAS.years);

// Shortcut for retrieving the availability column using all known aliases.
export const findAvailabilityRawValue = (row: ExcelRow): unknown =>
  findValueByAliases(row, EXCEL_ALIAS.availabilityColumns);

// Normalizes any text to lowercase without accents/spaces to simplify comparisons.
export const normalizeAliasToken = (value: unknown): string =>
  String(value ? value : '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

// Checks if a normalized token matches one of the "true" availability aliases.
export const isTrueAvailabilityToken = (token: string): boolean =>
  EXCEL_ALIAS.availabilityTrue.includes(token as AvailabilityTrueToken);

// Checks if a normalized token matches one of the "false" availability aliases.
export const isFalseAvailabilityToken = (token: string): boolean =>
  EXCEL_ALIAS.availabilityFalse.includes(token as AvailabilityFalseToken);
