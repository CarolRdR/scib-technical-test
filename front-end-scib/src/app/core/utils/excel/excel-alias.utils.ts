import { EXCEL_ALIAS } from '../../constants/excel/excel-alias.constants';

type ExcelRow = Record<string, unknown>;
type AvailabilityTrueToken = (typeof EXCEL_ALIAS.availabilityTrue)[number];
type AvailabilityFalseToken = (typeof EXCEL_ALIAS.availabilityFalse)[number];

export const findValueByAliases = (row: ExcelRow, aliases: readonly string[]): unknown => {
  for (const key of aliases) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

export const findYearsValue = (row: ExcelRow): unknown => findValueByAliases(row, EXCEL_ALIAS.years);

export const findAvailabilityRawValue = (row: ExcelRow): unknown =>
  findValueByAliases(row, EXCEL_ALIAS.availabilityColumns);

export const normalizeAliasToken = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const isTrueAvailabilityToken = (token: string): boolean =>
  EXCEL_ALIAS.availabilityTrue.includes(token as AvailabilityTrueToken);

export const isFalseAvailabilityToken = (token: string): boolean =>
  EXCEL_ALIAS.availabilityFalse.includes(token as AvailabilityFalseToken);
