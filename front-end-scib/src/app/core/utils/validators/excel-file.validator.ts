import { CandidateExcelData } from '../../interfaces/candidate.interface';

const XLSX_EXTENSION = '.xlsx';
const VALID_XLSX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream'
]);

export class ExcelValidationError extends Error {
  constructor(public readonly translationKey: string) {
    super(translationKey);
    this.name = 'ExcelValidationError';
  }
}

const FILE_ERROR_KEY = 'ERRORS.UPLOAD_FILE';

export function ensureXlsxFile(file: File | null | undefined): File {
  if (!file) {
    throw new ExcelValidationError(FILE_ERROR_KEY);
  }

  if (!file.name.toLowerCase().endsWith(XLSX_EXTENSION)) {
    throw new ExcelValidationError(FILE_ERROR_KEY);
  }

  if (file.type && !VALID_XLSX_MIME_TYPES.has(file.type)) {
    throw new ExcelValidationError(FILE_ERROR_KEY);
  }

  return file;
}

export function ensureSingleDataRow(
  rows: CandidateExcelData[] | null | undefined
): CandidateExcelData {
  if (!rows?.length) {
    throw new ExcelValidationError(FILE_ERROR_KEY);
  }

  if (rows.length > 1) {
    throw new ExcelValidationError(FILE_ERROR_KEY);
  }

  return rows[0];
}
