import type { Express } from 'express';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import * as XLSX from 'xlsx';
import { BadRequestException } from '@nestjs/common';
import { ExcelCandidateParser } from './excel-candidate-parser';

type CandidateRow = Record<string, unknown>;

const DEFAULT_ROW: CandidateRow = {
  seniority: 'junior',
  years: 5,
  availability: true,
};

describe('ExcelCandidateParser', () => {
  let parser: ExcelCandidateParser;

  beforeEach(() => {
    parser = new ExcelCandidateParser();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should parse excel data from multer file', async () => {
    const file = createMulterFile(createExcelBuffer([DEFAULT_ROW]));

    await expect(parser.parseCandidateFile(file)).resolves.toEqual({
      seniority: 'junior',
      years: 5,
      availability: true,
    });
  });

  it('should throw when required columns are missing', async () => {
    const file = createMulterFile(
      createExcelBuffer([
        {
          years: 4,
          availability: true,
        },
      ]),
    );

    await expect(parser.parseCandidateFile(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when availability is invalid', async () => {
    const file = createMulterFile(
      createExcelBuffer([
        {
          seniority: 'senior',
          years: 8,
          availability: 'maybe',
        },
      ]),
    );

    await expect(parser.parseCandidateFile(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it.each([
    [{ seniority: 123, years: 5, availability: true }],
    [{ seniority: '', years: 5, availability: true }],
    [{ seniority: 'mid', years: 5, availability: true }],
    [{ seniority: 'junior', years: 0, availability: true }],
    [{ seniority: 'junior', years: -1, availability: true }],
    [{ seniority: 'junior', years: 'abc', availability: true }],
  ])('should throw for invalid row %o', async (row) => {
    const file = createMulterFile(createExcelBuffer([row]));
    await expect(parser.parseCandidateFile(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when excel has no rows', async () => {
    const buffer = createExcelBuffer([]);
    jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValueOnce([]);
    const file = createMulterFile(buffer);

    await expect(parser.parseCandidateFile(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when file has no buffer or path', async () => {
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.xlsx',
      encoding: '7bit',
      mimetype:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 0,
      destination: '',
      filename: '',
      path: '',
    } as Express.Multer.File;

    await expect(parser.parseCandidateFile(file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should read file from disk when buffer is missing', async () => {
    const buffer = createExcelBuffer([DEFAULT_ROW]);
    const readSpy = jest.spyOn(fs, 'readFile').mockResolvedValue(buffer);
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.xlsx',
      encoding: '7bit',
      mimetype:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: buffer.length,
      destination: '',
      filename: '',
      path: 'disk/path.xlsx',
    } as Express.Multer.File;

    await expect(parser.parseCandidateFile(file)).resolves.toEqual({
      seniority: 'junior',
      years: 5,
      availability: true,
    });
    expect(readSpy).toHaveBeenCalledWith('disk/path.xlsx');
  });
});

const createExcelBuffer = (rows: CandidateRow[]): Buffer => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const result: unknown = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
  if (!Buffer.isBuffer(result)) {
    throw new Error('Failed to generate Excel buffer');
  }
  return result;
};

const createMulterFile = (buffer: Buffer): Express.Multer.File => {
  const stream = Readable.from(buffer);
  return {
    fieldname: 'file',
    originalname: 'test.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
    destination: '',
    filename: '',
    path: '',
    buffer,
    stream,
  } as Express.Multer.File;
};
