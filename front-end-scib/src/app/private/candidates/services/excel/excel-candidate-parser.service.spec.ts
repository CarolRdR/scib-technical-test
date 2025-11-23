import { TestBed } from '@angular/core/testing';
import * as XLSX from 'xlsx';
import { ERROR_MESSAGE_KEYS } from '../../../../core/constants/errors/error-messages';
import { ExcelValidationError } from '../../../../core/utils/validators/excel-file.validator';
import { ExcelCandidateParserService } from './excel-candidate-parser.service';

describe('ExcelCandidateParserService', () => {
  let service: ExcelCandidateParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExcelCandidateParserService);
  });

  const createExcelFile = (rows: Record<string, unknown>[]): File => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    return new File([buffer], 'candidate.xlsx');
  };

  it('should parse and normalize candidate data', async () => {
    const file = createExcelFile([
      {
        Seniority: 'Senior',
        'Años de experiencia': 3,
        Disponibilidad: 'sí'
      }
    ]);

    const { excelData, normalizedFile } = await service.parseCandidateFile(file);

    expect(excelData).toEqual({
      seniority: 'senior',
      years: 3,
      availability: true
    });

    const normalizedBuffer = await normalizedFile.arrayBuffer();
    const workbook = XLSX.read(normalizedBuffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: true }) as CandidateSheetRow[];

    expect(rows).toEqual([
      { seniority: 'senior', years: 3, availability: true }
    ]);
  });

  it('should throw when availability column is invalid', async () => {
    const file = createExcelFile([
      {
        Seniority: 'Junior',
        Years: 1,
        Disponibilidad: 'maybe'
      }
    ]);

    await expectAsync(service.parseCandidateFile(file)).toBeRejectedWithError(
      ExcelValidationError,
      ERROR_MESSAGE_KEYS.upload.availability
    );
  });
});

type CandidateSheetRow = {
  seniority: string;
  years: number;
  availability: boolean;
};
