import { Injectable } from '@nestjs/common';
import { CandidateUploadRequest } from './dto/candidate-upload.dto';

@Injectable()
export class CandidatesService {
  async processCandidateUpload(payload: CandidateUploadRequest) {
    const { name, surname } = payload;
    // TODO: Implement Excel parsing and validation logic
    return { name, surname };
  }
}
