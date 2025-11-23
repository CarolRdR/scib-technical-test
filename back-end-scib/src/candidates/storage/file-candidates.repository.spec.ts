import { promises as fs } from 'fs';
import { join } from 'path';
import { FileCandidatesRepository } from './file-candidates.repository';
import type { CandidateDto } from '../dto/candidate.dto';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn(),
  },
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const STORAGE_PATH = join(process.cwd(), 'data', 'candidates.json');

describe('FileCandidatesRepository', () => {
  let repository: FileCandidatesRepository;

  beforeEach(() => {
    repository = new FileCandidatesRepository();
    jest.clearAllMocks();
    mockedFs.mkdir.mockResolvedValue(undefined as never);
    mockedFs.access.mockResolvedValue(undefined as never);
    mockedFs.writeFile.mockResolvedValue(undefined as never);
  });

  it('should list candidates from storage file', async () => {
    const candidates: CandidateDto[] = [
      {
        name: 'John',
        surname: 'Doe',
        seniority: 'junior',
        years: 3,
        availability: true,
      },
    ];
    mockedFs.readFile.mockResolvedValueOnce(JSON.stringify(candidates));

    await expect(repository.findAll()).resolves.toEqual(candidates);
    expect(mockedFs.readFile).toHaveBeenCalledWith(STORAGE_PATH, {
      encoding: 'utf8',
    });
    expect(mockedFs.mkdir).toHaveBeenCalledTimes(1);
    expect(mockedFs.access).toHaveBeenCalledTimes(1);
  });

  it('should append candidate and persist file on save', async () => {
    const existing: CandidateDto[] = [
      {
        name: 'Jane',
        surname: 'Smith',
        seniority: 'senior',
        years: 8,
        availability: false,
      },
    ];
    const newCandidate: CandidateDto = {
      name: 'John',
      surname: 'Doe',
      seniority: 'junior',
      years: 4,
      availability: true,
    };

    mockedFs.readFile.mockResolvedValueOnce(JSON.stringify(existing));

    await expect(repository.save(newCandidate)).resolves.toEqual(
      newCandidate,
    );

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      STORAGE_PATH,
      JSON.stringify([...existing, newCandidate], null, 2),
      'utf8',
    );
  });

  it('should initialize storage when file is missing', async () => {
    const missingError = Object.assign(new Error('missing'), {
      code: 'ENOENT',
    });
    mockedFs.access.mockRejectedValueOnce(missingError);
    mockedFs.readFile.mockResolvedValueOnce('[]');

    await expect(repository.findAll()).resolves.toEqual([]);
    expect(mockedFs.writeFile).toHaveBeenCalledWith(STORAGE_PATH, '[]', 'utf8');
  });

  it('should rethrow unexpected access errors', async () => {
    const unexpected = new Error('boom');
    mockedFs.access.mockRejectedValueOnce(unexpected);

    await expect(repository.findAll()).rejects.toThrow(unexpected);
  });
});
