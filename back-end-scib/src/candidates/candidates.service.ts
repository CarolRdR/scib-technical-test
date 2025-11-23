import { Injectable } from '@nestjs/common';
import { CandidateDto } from './dto/candidate.dto';
import { CandidateUploadRequest } from './dto/candidate-upload.dto';
import { FileCandidatesRepository } from './storage/file-candidates.repository';
import { ExcelCandidateParser } from './utils/excel-candidate-parser';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly candidatesRepository: FileCandidatesRepository,
    private readonly excelCandidateParser: ExcelCandidateParser,
  ) {}

  async processCandidateUpload(
    payload: CandidateUploadRequest,
  ): Promise<CandidateDto> {
    const excelData = await this.excelCandidateParser.parseCandidateFile(
      payload.file,
    );

    const candidate: CandidateDto = {
      name: payload.name,
      surname: payload.surname,
      ...excelData,
    };

    return this.candidatesRepository.save(candidate);
  }

  async listCandidates(): Promise<CandidateDto[]> {
    return this.candidatesRepository.findAll();
  }
}
