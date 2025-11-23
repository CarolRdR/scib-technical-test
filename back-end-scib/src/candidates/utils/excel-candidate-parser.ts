import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as XLSX from 'xlsx';
import { candidateErrors } from '../../common/errors/candidate-errors';
import type { CandidateDto } from '../dto/candidate.dto';

export type CandidateExcelData = Pick<
  CandidateDto,
  'seniority' | 'years' | 'availability'
>;

type ExcelRow = Record<string, unknown>;

@Injectable()
export class ExcelCandidateParser {
  private readonly logger = new Logger(ExcelCandidateParser.name);

  // Reads the uploaded file, parses it, and ensures any temp file is deleted afterwards.
  async parseCandidateFile(file: Express.Multer.File): Promise<CandidateExcelData> {
    const { buffer, tempPath } = await this.readUploadedFile(file);
    try {
      return this.parseExcel(buffer);
    } finally {
      if (tempPath) {
        void fs.unlink(tempPath).catch((error) =>
          this.logger.warn(`Failed to delete temp file ${tempPath}: ${error}`),
        );
      }
    }
  }

  // Loads the file contents from memory or disk and tracks the temp path (if any) for cleanup.
  private async readUploadedFile(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; tempPath?: string }> {
    if (file.buffer?.length) {
      return { buffer: file.buffer };
    }

    if (file.path) {
      const diskBuffer = await fs.readFile(file.path);
      return { buffer: diskBuffer, tempPath: file.path };
    }

    throw candidateErrors.fileHasNoData();
  }

  // Converts the Excel buffer into validated candidate attributes.
  private parseExcel(buffer: Buffer): CandidateExcelData {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const [firstSheetName] = workbook.SheetNames;
      if (!firstSheetName) {
        throw candidateErrors.excelWithoutSheets();
      }

      const sheet = workbook.Sheets[firstSheetName];
      if (!sheet) {
        throw candidateErrors.excelWithoutSheets();
      }

      const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
        defval: null,
      });
      if (!rows.length) {
        throw candidateErrors.excelWithoutRows();
      }

      const normalizedRow = this.normalizeRow(rows[0]);
      return {
        seniority: this.parseSeniority(normalizedRow.seniority),
        years: this.parseYears(normalizedRow.years),
        availability: this.parseAvailability(normalizedRow.availability),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw candidateErrors.excelProcessingFailed();
    }
  }

  // Normalizes Excel column headers by trimming and lowercasing them.
  private normalizeRow(row: ExcelRow): ExcelRow {
    return Object.entries(row).reduce<ExcelRow>((acc, [key, value]) => {
      acc[key.trim().toLowerCase()] = value;
      return acc;
    }, {});
  }

  // Validates and normalizes the seniority column.
  private parseSeniority(value: unknown): 'junior' | 'senior' {
    if (typeof value !== 'string') {
      throw candidateErrors.seniorityMustBeString(value);
    }
    const normalized = value.trim().toLowerCase();
    if (!this.isValidSeniority(normalized)) {
      throw candidateErrors.seniorityInvalidValue(value);
    }
    return normalized;
  }

  // Parses years of experience and enforces positive integer values.
  private parseYears(value: unknown): number {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : NaN;

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw candidateErrors.yearsInvalidValue(value);
    }

    return parsed;
  }

  // Parses availability, accepting boolean or string representations.
  private parseAvailability(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }

    throw candidateErrors.availabilityInvalidValue(value);
  }

  // Helper to ensure seniority strings match the accepted literals.
  private isValidSeniority(value: string): value is 'junior' | 'senior' {
    return value === 'junior' || value === 'senior';
  }
}
