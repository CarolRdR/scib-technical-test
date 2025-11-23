import type { Express } from 'express';
import { Injectable, PipeTransform } from '@nestjs/common';
import { candidateErrors } from '../../common/errors/candidate-errors';

@Injectable()
export class MulterFilePipe implements PipeTransform<unknown, Express.Multer.File> {
  transform(value: unknown): Express.Multer.File {
    if (this.isMulterFile(value)) {
      return value;
    }
    throw candidateErrors.uploadedFileInvalid();
  }

  private isMulterFile(value: unknown): value is Express.Multer.File {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.fieldname === 'string' &&
      typeof candidate.mimetype === 'string'
    );
  }
}
