import type { Express } from 'express';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from './candidates.service';
import { CandidateUploadRequest } from './dto/candidate-upload.dto';
import { CandidateDto } from './dto/candidate.dto';
import { FileCandidatesRepository } from './storage/file-candidates.repository';
import {
  CandidateExcelData,
  ExcelCandidateParser,
} from './utils/excel-candidate-parser';

describe('CandidatesService', () => {
  let service: CandidatesService;
  let repository: jest.Mocked<
    Pick<FileCandidatesRepository, 'save' | 'findAll'>
  >;
  let parser: jest.Mocked<Pick<ExcelCandidateParser, 'parseCandidateFile'>>;

  beforeEach(async () => {
    repository = {
      save: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<Pick<FileCandidatesRepository, 'save' | 'findAll'>>;
    parser = {
      parseCandidateFile: jest.fn(),
    } as jest.Mocked<Pick<ExcelCandidateParser, 'parseCandidateFile'>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: FileCandidatesRepository, useValue: repository },
        { provide: ExcelCandidateParser, useValue: parser },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should combine parser data with form payload and persist candidate', async () => {
    const payload = createPayload();
    const parsedFromExcel: CandidateExcelData = {
      seniority: 'junior',
      years: 6,
      availability: true,
    };
    parser.parseCandidateFile.mockResolvedValue(parsedFromExcel);

    const expected: CandidateDto = {
      name: payload.name,
      surname: payload.surname,
      ...parsedFromExcel,
    };

    repository.save.mockResolvedValue(expected);

    await expect(service.processCandidateUpload(payload)).resolves.toEqual(
      expected,
    );
    expect(parser.parseCandidateFile).toHaveBeenCalledWith(payload.file);
    expect(repository.save).toHaveBeenCalledWith(expected);
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

  it('should propagate parser errors without calling repository', async () => {
    const payload = createPayload();
    const parserError = new BadRequestException('invalid data');
    parser.parseCandidateFile.mockRejectedValue(parserError);

    await expect(service.processCandidateUpload(payload)).rejects.toThrow(
      parserError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});

const createPayload = (): CandidateUploadRequest => ({
  name: 'John',
  surname: 'Doe',
  file: createMulterFile(),
});

const createMulterFile = (): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'test.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 0,
    destination: '',
    filename: '',
    path: '',
  }) as Express.Multer.File;
