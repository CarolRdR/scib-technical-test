import { Injectable, Logger } from '@nestjs/common';
import { CandidateDto } from './dto/candidate.dto';
import { CandidateUploadRequest } from './dto/candidate-upload.dto';
import { FileCandidatesRepository } from './storage/file-candidates.repository';
import { ExcelCandidateParser } from './utils/excel-candidate-parser';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

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

    this.logger.log(
      `Saving candidate ${candidate.name} ${candidate.surname} (${candidate.seniority})`,
    );
    return this.candidatesRepository.save(candidate);
  }

  async listCandidates(): Promise<CandidateDto[]> {
    const candidates = await this.candidatesRepository.findAll();
    this.logger.log(`Retrieved ${candidates.length} candidates from storage.`);
    return candidates;
  }
}
