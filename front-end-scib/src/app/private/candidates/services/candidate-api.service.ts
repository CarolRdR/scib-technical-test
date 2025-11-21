import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Candidate } from '../../../core/interfaces/candidate.interface';

export interface UploadCandidatePayload {
  name: string;
  surname: string;
  file: File;
}

const baseUrl = `${environment.apiBase}/candidates`

@Injectable({
  providedIn: 'root'
})
export class CandidateApiService {
  private readonly http = inject(HttpClient);

  uploadCandidate(payload: UploadCandidatePayload): Observable<Candidate> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('surname', payload.surname);
    formData.append('file', payload.file, payload.file.name);
    return this.http.post<Candidate>(`${baseUrl}/upload`, formData);
  }
}
