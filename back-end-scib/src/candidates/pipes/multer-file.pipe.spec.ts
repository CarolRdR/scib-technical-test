import type { Express } from 'express';
import { BadRequestException } from '@nestjs/common';
import { MulterFilePipe } from './multer-file.pipe';

describe('MulterFilePipe', () => {
  let pipe: MulterFilePipe;

  beforeEach(() => {
    pipe = new MulterFilePipe();
  });

  it('should return value when it is a multer file', () => {
    const file = createMulterFile();

    expect(pipe.transform(file)).toBe(file);
  });

  it.each([null, undefined, 'file', 123, {}, { fieldname: 'file' }])(
    'should throw when value %p is not valid',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException);
    },
  );
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
