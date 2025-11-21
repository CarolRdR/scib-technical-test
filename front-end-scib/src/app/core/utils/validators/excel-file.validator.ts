import { CandidateExcelData } from '../../interfaces/candidate.interface';

const XLSX_EXTENSION = '.xlsx';
const VALID_XLSX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream'
]);

export class ExcelValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelValidationError';
  }
}

export function ensureXlsxFile(file: File | null | undefined): File {
  if (!file) {
    throw new ExcelValidationError('Debes adjuntar un archivo .xlsx.');
  }

  if (!file.name.toLowerCase().endsWith(XLSX_EXTENSION)) {
    throw new ExcelValidationError('El archivo debe tener extensión .xlsx.');
  }

  if (file.type && !VALID_XLSX_MIME_TYPES.has(file.type)) {
    throw new ExcelValidationError('El tipo de archivo no coincide con un Excel válido.');
  }

  return file;
}

export function ensureSingleDataRow(
  rows: CandidateExcelData[] | null | undefined
): CandidateExcelData {
  if (!rows?.length) {
    throw new ExcelValidationError('El Excel debe incluir una fila con la información del candidato.');
  }

  if (rows.length > 1) {
    throw new ExcelValidationError('El Excel solo puede contener una fila con datos.');
  }

  return rows[0];
}
