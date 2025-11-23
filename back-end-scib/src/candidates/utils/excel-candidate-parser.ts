import type { Express } from 'express';
import { Injectable, BadRequestException } from '@nestjs/common';
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
  // Reads the uploaded file and returns the parsed candidate data.
  async parseCandidateFile(file: Express.Multer.File): Promise<CandidateExcelData> {
    const buffer = await this.readUploadedFile(file);
    return this.parseExcel(buffer);
  }

  // Fetches the file contents from memory or disk, throwing when no data is available.
  private async readUploadedFile(file: Express.Multer.File): Promise<Buffer> {
    if (file.buffer?.length) {
      return file.buffer;
    }

    if (file.path) {
      return fs.readFile(file.path);
    }

    throw candidateErrors.fileHasNoData();
  }

  // Converts the Excel buffer into structured candidate attributes with validations.
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

  // Normalizes all column names to lowercase without surrounding spaces.
  private normalizeRow(row: ExcelRow): ExcelRow {
    return Object.entries(row).reduce<ExcelRow>((acc, [key, value]) => {
      acc[key.trim().toLowerCase()] = value;
      return acc;
    }, {});
  }

  // Ensures the seniority value is a valid string ("junior" or "senior").
  private parseSeniority(value: unknown): 'junior' | 'senior' {
    if (typeof value !== 'string') {
      throw candidateErrors.seniorityMustBeString();
    }
    const normalized = value.trim().toLowerCase();
    if (!this.isValidSeniority(normalized)) {
      throw candidateErrors.seniorityInvalidValue();
    }
    return normalized;
  }

  // Parses years of experience, enforcing positive integers.
  private parseYears(value: unknown): number {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value)
          : NaN;

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw candidateErrors.yearsInvalidValue();
    }

    return parsed;
  }

  // Parses availability, accepting booleans or their string representations.
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

    throw candidateErrors.availabilityInvalidValue();
  }

  // Narrows seniority strings to the expected literals.
  private isValidSeniority(value: string): value is 'junior' | 'senior' {
    return value === 'junior' || value === 'senior';
  }
}
