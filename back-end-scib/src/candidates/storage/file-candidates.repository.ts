import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { CandidateDto } from '../dto/candidate.dto';

@Injectable()
export class FileCandidatesRepository {
  private readonly storagePath = join(process.cwd(), 'data', 'candidates.json');

  async findAll(): Promise<CandidateDto[]> {
    return this.readCandidatesFile();
  }

  async save(candidate: CandidateDto): Promise<CandidateDto> {
    const candidates = await this.readCandidatesFile();
    candidates.push(candidate);
    await this.writeCandidatesFile(candidates);
    return candidate;
  }

  private async readCandidatesFile(): Promise<CandidateDto[]> {
    await this.ensureStorageFile();
    const raw = await fs.readFile(this.storagePath, { encoding: 'utf8' });
    return JSON.parse(raw) as CandidateDto[];
  }

  private async writeCandidatesFile(candidates: CandidateDto[]): Promise<void> {
    await this.ensureStorageFile();
    await fs.writeFile(
      this.storagePath,
      JSON.stringify(candidates, null, 2),
      'utf8',
    );
  }

  private async ensureStorageFile(): Promise<void> {
    await fs.mkdir(dirname(this.storagePath), { recursive: true });
    try {
      await fs.access(this.storagePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      await fs.writeFile(this.storagePath, '[]', 'utf8');
    }
  }
}
