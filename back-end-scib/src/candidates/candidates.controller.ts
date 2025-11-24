import type { Express } from 'express';
import {
  Body,
  Controller,
  Get,
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
import { MulterFilePipe } from './pipes/multer-file.pipe';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  async listCandidates() {
    return this.candidatesService.listCandidates();
  }

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
          fallbackToMimetype: true,
          // Magic-number checks reject some zipped XLSX buffers, so rely on MIME
          // type plus the custom Multer pipe instead.
          skipMagicNumbersValidation: true,
        })
        .addMaxSizeValidator({
          // 2MB keeps uploads snappy and prevents oversized Excel dumps.
          maxSize: 2 * 1024 * 1024,
        })
        .build({ fileIsRequired: true }),
      new MulterFilePipe(),
    )
    file: Express.Multer.File,
  ) {
    const payload: CandidateUploadRequest = {
      name: formData.name,
      surname: formData.surname,
      file,
    };
    return this.candidatesService.processCandidateUpload(payload);
  }
}
