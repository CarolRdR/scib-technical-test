import { Injectable, computed, signal } from '@angular/core';
import { Candidate } from '../../../core/interfaces/candidate.interface';

@Injectable({
  providedIn: 'root'
})
export class CandidateStorageService {
  private readonly candidatesSignal = signal<Candidate[]>([]);

  readonly candidates = computed(() => this.candidatesSignal());

  addCandidate(candidate: Candidate): void {
    this.candidatesSignal.update((current) => [...current, candidate]);
  }

  reset(): void {
    this.candidatesSignal.set([]);
  }
}
