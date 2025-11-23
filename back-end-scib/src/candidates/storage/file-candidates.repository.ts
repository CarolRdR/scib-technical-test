import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { CandidateDto } from '../dto/candidate.dto';

@Injectable()
export class FileCandidatesRepository {
  private readonly storagePath = join(process.cwd(), 'data', 'candidates.json');

  // Returns all candidates by reading the JSON file from disk.
  async findAll(): Promise<CandidateDto[]> {
    return this.readCandidatesFile();
  }

  // Adds a candidate by reading, appending, and writing back the JSON file.
  async save(candidate: CandidateDto): Promise<CandidateDto> {
    const candidates = await this.readCandidatesFile();
    candidates.push(candidate);
    await this.writeCandidatesFile(candidates);
    return candidate;
  }

  // Reads the JSON file from disk ensuring it exists beforehand.
  private async readCandidatesFile(): Promise<CandidateDto[]> {
    await this.ensureStorageFile();
    const raw = await fs.readFile(this.storagePath, { encoding: 'utf8' });
    return JSON.parse(raw) as CandidateDto[];
  }

  // Persists the list of candidates to disk in a human-friendly JSON format.
  private async writeCandidatesFile(candidates: CandidateDto[]): Promise<void> {
    await this.ensureStorageFile();
    await fs.writeFile(
      this.storagePath,
      JSON.stringify(candidates, null, 2),
      'utf8',
    );
  }

  // Creates the directory/file if they don't exist so read/write operations succeed.
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
