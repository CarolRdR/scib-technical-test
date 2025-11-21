import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
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
  });
});

type ErrorResponse = {
  statusCode: number;
  message: string | string[];
  error?: string;
};
