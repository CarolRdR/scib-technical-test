import type { Express } from 'express';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import { CandidatesService } from './candidates.service';
import { CandidateDto } from './dto/candidate.dto';
import { CandidateUploadRequest } from './dto/candidate-upload.dto';
import { FileCandidatesRepository } from './storage/file-candidates.repository';

type CandidateRow = Record<string, unknown>;

const DEFAULT_ROW: CandidateRow = {
  seniority: 'junior',
  years: 5,
  availability: true,
};

describe('CandidatesService', () => {
  let service: CandidatesService;
  let repository: jest.Mocked<FileCandidatesRepository>;

  beforeEach(async () => {
    repository = {
      save: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<FileCandidatesRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: FileCandidatesRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should parse excel data and combine it with form payload', async () => {
    const payload = createPayload([
      {
        seniority: 'Junior',
        years: '6',
        availability: 'true',
      },
    ]);

    const expected: CandidateDto = {
      name: payload.name,
      surname: payload.surname,
      seniority: 'junior',
      years: 6,
      availability: true,
    };

    repository.save.mockResolvedValue(expected);

    await expect(service.processCandidateUpload(payload)).resolves.toEqual(
      expected,
    );
    expect(repository.save).toHaveBeenCalledWith(expected);
  });

  it('should throw when required columns are missing', async () => {
    const payload = createPayload([
      {
        years: 4,
        availability: true,
      },
    ]);

    await expect(service.processCandidateUpload(payload)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should list candidates via repository', async () => {
    const candidates: CandidateDto[] = [
      {
        name: 'John',
        surname: 'Doe',
        seniority: 'junior',
        years: 3,
        availability: true,
      },
    ];
    repository.findAll.mockResolvedValue(candidates);

    await expect(service.listCandidates()).resolves.toEqual(candidates);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should throw when availability is invalid', async () => {
    const payload = createPayload([
      {
        seniority: 'senior',
        years: 8,
        availability: 'maybe',
      },
    ]);

    await expect(service.processCandidateUpload(payload)).rejects.toThrow(
      BadRequestException,
    );
  });

  it.each([
    [{ seniority: 123, years: 5, availability: true }],
    [{ seniority: '', years: 5, availability: true }],
    [{ seniority: 'mid', years: 5, availability: true }],
    [{ seniority: 'junior', years: -1, availability: true }],
    [{ seniority: 'junior', years: 'abc', availability: true }],
  ])('should throw for invalid row %o', async (row) => {
    const payload = createPayload([row]);
    await expect(service.processCandidateUpload(payload)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when excel has no rows', async () => {
    const payload = createPayload();
    jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValueOnce([]);

    await expect(service.processCandidateUpload(payload)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when file has no buffer or path', async () => {
    const payload: CandidateUploadRequest = {
      name: 'John',
      surname: 'Doe',
      file: {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 0,
        destination: '',
        filename: '',
        path: '',
      } as Express.Multer.File,
    };

    await expect(service.processCandidateUpload(payload)).rejects.toThrow(
      BadRequestException,
    );
  });
});

const createPayload = (
  rows: CandidateRow[] = [DEFAULT_ROW],
): CandidateUploadRequest => {
  const buffer = createExcelBuffer(rows);
  return {
    name: 'John',
    surname: 'Doe',
    file: createMulterFile(buffer),
  };
};

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
