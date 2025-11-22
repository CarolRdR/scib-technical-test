import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { Candidate } from '../../../../core/interfaces/candidate.interface';
import { CandidateApiService } from './candidate-api.service';

describe('CandidateApiService', () => {
  let service: CandidateApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CandidateApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should upload candidate form data', () => {
    const payload = {
      name: 'John',
      surname: 'Smith',
      file: new File(['test'], 'candidate.xlsx')
    };
    const mockResponse: Candidate = {
      name: payload.name,
      surname: payload.surname,
      seniority: 'junior',
      years: 2,
      availability: true
    };

    service.uploadCandidate(payload).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiBase}/candidates/upload`);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('name')).toBe(payload.name);
    expect(body.get('surname')).toBe(payload.surname);
    const fileEntry = body.get('file') as File;
    expect(fileEntry).toBeTruthy();
    expect(fileEntry.name).toBe(payload.file.name);

    req.flush(mockResponse);
  });

  it('should request candidate list', () => {
    const mockResponse: Candidate[] = [
      { name: 'Jane', surname: 'Doe', seniority: 'senior', years: 5, availability: true }
    ];

    service.listCandidates().subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiBase}/candidates`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
