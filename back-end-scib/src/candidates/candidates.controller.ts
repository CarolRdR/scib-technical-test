import {
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
    file: Express.Multer.File,
  ) {
    const name = String(formData.name);
    const surname = String(formData.surname);
    const payload = {
      name,
      surname,
      file,
    } satisfies CandidateUploadRequest;
    return this.candidatesService.processCandidateUpload(payload);
  }
}
