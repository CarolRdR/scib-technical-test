import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as XLSX from 'xlsx';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('POST /candidates/upload', () => {
    const sendBaseRequest = () =>
      request(app.getHttpServer())
        .post('/candidates/upload')
        .field('name', 'John')
        .field('surname', 'Doe');

    it('should return 400 when file is missing', async () => {
      const response = await sendBaseRequest().expect(400);
      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(400);
      expect(body.message).toEqual('File is required');
    });

    it('should return 400 when MIME type is invalid', async () => {
      const response = await sendBaseRequest()
        .attach('file', Buffer.from('invalid'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body.statusCode).toBe(400);
      expect(body.message).toContain('expected type');
    });

    it('should accept a valid Excel file and return the combined payload', async () => {
      const excelBuffer = createExcelBuffer({
        seniority: 'senior',
        years: 7,
        availability: 'true',
      });

      const response = await sendBaseRequest()
        .attach('file', excelBuffer, {
          filename: 'candidate.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .expect(201);
      expect(response.body).toEqual({
        name: 'John',
        surname: 'Doe',
        seniority: 'senior',
        years: 7,
        availability: true,
      });
    });
  });
});

type ErrorResponse = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

const createExcelBuffer = (row: Record<string, unknown>): Buffer => {
  const worksheet = XLSX.utils.json_to_sheet([row]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const output = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.isBuffer(output) ? output : Buffer.from(output);
};
