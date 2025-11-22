import { TestBed } from '@angular/core/testing';
import { Candidate } from '../../../../core/interfaces/candidate.interface';
import { CandidateStorageService } from './candidate-storage.service';


describe('CandidateStorageService', () => {
  let service: CandidateStorageService;

  const mockCandidate: Candidate = {
    name: 'Jane',
    surname: 'Doe',
    seniority: 'senior',
    years: 5,
    availability: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CandidateStorageService);
  });

  it('should add candidates and reset loading state', () => {
    service.setLoading(true);
    service.addCandidate(mockCandidate);

    expect(service.candidates()).toEqual([mockCandidate]);
    expect(service.isLoading()).toBeFalse();
  });

  it('should reset collection and loading state', () => {
    service.addCandidate(mockCandidate);
    service.setLoading(true);

    service.reset();

    expect(service.candidates()).toEqual([]);
    expect(service.isLoading()).toBeFalse();
  });
});
