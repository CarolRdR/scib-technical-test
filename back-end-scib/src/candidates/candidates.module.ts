import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { FileCandidatesRepository } from './storage/file-candidates.repository';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService, FileCandidatesRepository],
  exports: [CandidatesService],
})
export class CandidatesModule {}
