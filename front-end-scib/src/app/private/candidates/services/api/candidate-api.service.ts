import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Candidate } from '../../../../core/interfaces/candidate.interface';

export interface UploadCandidatePayload {
  name: string;
  surname: string;
  file: File;
}

@Injectable({
  providedIn: 'root'
})
export class CandidateApiService {
  private readonly baseUrl = `${environment.apiBase}/candidates`;

  constructor(private readonly http: HttpClient) {}

  uploadCandidate(payload: UploadCandidatePayload): Observable<Candidate> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('surname', payload.surname);
    formData.append('file', payload.file, payload.file.name);
    return this.http.post<Candidate>(`${this.baseUrl}/upload`, formData);
  }
}
