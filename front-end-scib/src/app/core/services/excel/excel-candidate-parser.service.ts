import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ERROR_MESSAGE_KEYS } from '../../constants/errors/error-messages';
import { EXCEL_ALIAS } from '../../constants/excel/excel-alias.constants';
import { CandidateExcelData } from '../../interfaces/candidate.interface';
import { ExcelCandidateParseResult } from '../../interfaces/excel-candidate-parse.interface';
import { findAvailabilityRawValue, findYearsValue, isFalseAvailabilityToken, isTrueAvailabilityToken, normalizeAliasToken } from '../../utils/excel/excel-alias.utils';
import { ensureSingleDataRow, ExcelValidationError } from '../../utils/validators/excel-file.validator';

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
    const headerRow = rawRows[0] ? this.normalizeRowKeys(rawRows[0]) : {};
    this.ensureRequiredColumns(headerRow);

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
      const normalizedKey = this.normalizeKey(key);
      acc[normalizedKey] = value;
      return acc;
    }, {});
  }

  // Ensures seniority column is present and contains the allowed values.
  private extractSeniority(row: Record<string, unknown>): CandidateExcelData['seniority'] {
    const seniorityValue = String(row['seniority'] ? row['seniority'] : '').toLowerCase().trim();
    if (seniorityValue !== 'junior' && seniorityValue !== 'senior') {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.seniority);
    }

    return seniorityValue as CandidateExcelData['seniority'];
  }

  // Attempts to parse "years" from any of its known aliases and validates numeric range.
  private extractYears(row: Record<string, unknown>): number {
    const yearsRaw = findYearsValue(row);
    const years = Number(yearsRaw);
    if (!Number.isFinite(years) || years < 0) {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.years);
    }
    return years;
  }

  // Parses availability supporting different languages/boolean representations.
  private extractAvailability(row: Record<string, unknown>): boolean {
    const availabilityRaw = findAvailabilityRawValue(row);
    if (availabilityRaw === undefined || availabilityRaw === null || availabilityRaw === '') {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.availabilityRequired);
    }

    if (typeof availabilityRaw === 'boolean') {
      return availabilityRaw;
    }

    const normalizedAvailability = normalizeAliasToken(availabilityRaw);
    if (isTrueAvailabilityToken(normalizedAvailability)) {
      return true;
    }
    if (isFalseAvailabilityToken(normalizedAvailability)) {
      return false;
    }
    throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.availability);
  }

  private ensureRequiredColumns(row: Record<string, unknown>): void {
    if (!this.hasAliasKey(row, EXCEL_ALIAS.seniorityColumns)) {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.missingSeniorityColumn);
    }
    if (!this.hasAliasKey(row, EXCEL_ALIAS.years)) {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.missingYearsColumn);
    }
    if (!this.hasAliasKey(row, EXCEL_ALIAS.availabilityColumns)) {
      throw new ExcelValidationError(ERROR_MESSAGE_KEYS.upload.missingAvailabilityColumn);
    }
  }

  private hasAliasKey(row: Record<string, unknown>, aliases: readonly string[]): boolean {
    return aliases.some((alias) => Object.prototype.hasOwnProperty.call(row, this.normalizeKey(alias)));
  }

  private normalizeKey(key: string): string {
    return key
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
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
