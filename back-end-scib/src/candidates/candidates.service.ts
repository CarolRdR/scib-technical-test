import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as XLSX from 'xlsx';
import { candidateErrors } from '../common/errors/candidate-errors';
import { CandidateUploadRequest } from './dto/candidate-upload.dto';

type ExcelRow = Record<string, unknown>;

@Injectable()
export class CandidatesService {
  async processCandidateUpload(payload: CandidateUploadRequest) {
    const buffer = await this.readUploadedFile(payload.file);
    const excelData = this.parseExcel(buffer);

    return {
      name: payload.name,
      surname: payload.surname,
      ...excelData,
    };
  }

  private async readUploadedFile(file: Express.Multer.File): Promise<Buffer> {
    if (file.buffer?.length) {
      return file.buffer;
    }

    if (file.path) {
      return fs.readFile(file.path);
    }

    throw candidateErrors.fileHasNoData();
  }

  private parseExcel(buffer: Buffer) {
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

  private normalizeRow(row: ExcelRow): ExcelRow {
    return Object.entries(row).reduce<ExcelRow>((acc, [key, value]) => {
      acc[key.trim().toLowerCase()] = value;
      return acc;
    }, {});
  }

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

  private parseYears(value: unknown): number {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
        ? Number(value)
        : NaN;

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw candidateErrors.yearsInvalidValue();
    }

    return parsed;
  }

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

  private isValidSeniority(value: string): value is 'junior' | 'senior' {
    return value === 'junior' || value === 'senior';
  }
}
