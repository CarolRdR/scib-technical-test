import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Candidate } from '../../../core/interfaces/candidate.interface';

export interface UploadCandidatePayload {
  name: string;
  surname: string;
  file: File;
}

@Injectable({
  providedIn: 'root'
})
export class CandidateApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/candidates';

  uploadCandidate(payload: UploadCandidatePayload): Observable<Candidate> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('surname', payload.surname);
    formData.append('file', payload.file, payload.file.name);

    return this.http.post<Candidate>(`${this.baseUrl}/upload`, formData);
  }
}
