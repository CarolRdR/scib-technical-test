import type { Express } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidatesService } from './candidates.service';
import {
  CandidateUploadDto,
  CandidateUploadRequest,
} from './dto/candidate-upload.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCandidate(
    @Body(new ValidationPipe({ transform: true }))
    formData: CandidateUploadDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .addMaxSizeValidator({ maxSize: 2 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: unknown,
  ) {
    const name = String(formData.name);
    const surname = String(formData.surname);
    const uploadedFile = this.ensureUploadedFile(file);
    const payload = {
      name,
      surname,
      file: uploadedFile,
    } satisfies CandidateUploadRequest;
    return this.candidatesService.processCandidateUpload(payload);
  }

  private ensureUploadedFile(file: unknown): Express.Multer.File {
    if (!this.isMulterFile(file)) {
      throw new BadRequestException('Uploaded file payload is invalid');
    }
    return file;
  }

  private isMulterFile(file: unknown): file is Express.Multer.File {
    if (!file || typeof file !== 'object') {
      return false;
    }
    const candidate = file as Record<string, unknown>;
    return (
      typeof candidate.fieldname === 'string' &&
      typeof candidate.mimetype === 'string'
    );
  }
}
