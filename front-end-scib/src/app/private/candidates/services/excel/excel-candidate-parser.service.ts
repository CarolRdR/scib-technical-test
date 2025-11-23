import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { FALSE_AVAILABILITY_VALUES, TRUE_AVAILABILITY_VALUES, YEARS_KEYS } from '../../../../core/constants/excel/excel-candidate.constants';
import { ERROR_MESSAGE_KEYS } from '../../../../core/constants/errors/error-messages';
import { CandidateExcelData } from '../../../../core/interfaces/candidate.interface';
import { ExcelCandidateParseResult } from '../../../../core/interfaces/excel-candidate-parse.interface';
import { ensureSingleDataRow, ExcelValidationError } from '../../../../core/utils/validators/excel-file.validator';

@Injectable({
  providedIn: 'root'
})

export class ExcelCandidateParserService {
  // Parses file into domain data and normalized xlsx ready for upload.
  public async parseCandidateFile(file: File): Promise<ExcelCandidateParseResult> {
    const rows = await this.extractExcelRows(file);
    const excelData = ensureSingleDataRow(rows);
    const normalizedFile = this.normalizeExcelFile(excelData, file);
    return { excelData, normalizedFile };
  }

  // Reads the first sheet from the uploaded file and produces candidate-friendly rows.
  private async extractExcelRows(file: File): Promise<CandidateExcelData[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const [firstSheetName] = workbook.SheetNames;

    if (!firstSheetName) {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.noSheets);
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    return rawRows.map((row) => this.mapRowToCandidateData(row));
  }

  // Normalizes a sheet row (aliases, accents, booleans) into our domain interface.
  private mapRowToCandidateData(row: Record<string, unknown>): CandidateExcelData {
    const normalizedRow = this.normalizeRowKeys(row);
    const seniority = this.extractSeniority(normalizedRow);
    const years = this.extractYears(normalizedRow);
    const availability = this.extractAvailability(normalizedRow);

    return {
      seniority,
      years,
      availability
    };
  }

  // Normalizes column names (strip accents/spaces) to simplify key lookups.
  private normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
    return Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
      const normalizedKey = key
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .toLowerCase();
      acc[normalizedKey] = value;
      return acc;
    }, {});
  }

  // Ensures seniority column is present and contains the allowed values.
  private extractSeniority(row: Record<string, unknown>): CandidateExcelData['seniority'] {
    const seniorityValue = String(row['seniority'] ?? '').toLowerCase().trim();
    if (seniorityValue !== 'junior' && seniorityValue !== 'senior') {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.seniority);
    }

    return seniorityValue as CandidateExcelData['seniority'];
  }

  // Attempts to parse "years" from any of its known aliases and validates numeric range.
  private extractYears(row: Record<string, unknown>): number {
    const yearsRaw = YEARS_KEYS.map((key) => row[key]).find((value) => value !== undefined);
    const years = Number(yearsRaw);
    if (!Number.isFinite(years) || years < 0) {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.years);
    }
    return years;
  }

  // Parses availability supporting different languages/boolean representations.
  private extractAvailability(row: Record<string, unknown>): boolean {
    const availabilityRaw = row['availability'] ?? row['disponibilidad'];
    if (availabilityRaw === undefined || availabilityRaw === null || availabilityRaw === '') {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.availabilityRequired);
    }

    if (typeof availabilityRaw === 'boolean') {
      return availabilityRaw;
    }

    const normalizedAvailability = String(availabilityRaw).toLowerCase().trim();
    if (TRUE_AVAILABILITY_VALUES.includes(normalizedAvailability)) {
      return true;
    }
    if (FALSE_AVAILABILITY_VALUES.includes(normalizedAvailability)) {
      return false;
    }
    throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.availability);
  }


  // Builds a single-row Excel file with the expected column names for the API.
  private normalizeExcelFile(excelData: CandidateExcelData, originalFile: File): File {
    const worksheet = XLSX.utils.json_to_sheet(
      [
        {
          seniority: excelData.seniority,
          years: excelData.years,
          availability: excelData.availability
        }
      ],
      { header: ['seniority', 'years', 'availability'] }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'candidate');
    const normalizedBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

    return new File([normalizedBuffer], originalFile.name, {
      type: originalFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      lastModified: originalFile.lastModified
    });
  }
}
