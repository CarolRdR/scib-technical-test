import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { FileCandidatesRepository } from './storage/file-candidates.repository';
import { ExcelCandidateParser } from './utils/excel-candidate-parser';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService, FileCandidatesRepository, ExcelCandidateParser],
  exports: [CandidatesService],
})
export class CandidatesModule {}
