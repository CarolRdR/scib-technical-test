import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Candidate, CandidateUploadPayload } from '../../../../core/interfaces/candidate.interface';

@Injectable({
  providedIn: 'root'
})
export class CandidateApiService {
  private readonly baseUrl = `${environment.apiBase}/candidates`;

  constructor(private readonly http: HttpClient) {}

  public listCandidates(): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(this.baseUrl);
  }

  public uploadCandidate(payload: CandidateUploadPayload): Observable<Candidate> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('surname', payload.surname);
    formData.append('file', payload.file, payload.file.name);
    return this.http.post<Candidate>(`${this.baseUrl}/upload`, formData);
  }
}
