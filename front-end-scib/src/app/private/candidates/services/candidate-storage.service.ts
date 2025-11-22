import { Injectable, computed, signal } from '@angular/core';
import { Candidate } from '../../../core/interfaces/candidate.interface';

@Injectable({
  providedIn: 'root'
})
export class CandidateStorageService {
  private readonly candidatesSignal = signal<Candidate[]>([]);
  private readonly loadingSignal = signal(false);

  readonly candidates = computed(() => this.candidatesSignal());
  readonly isLoading = computed(() => this.loadingSignal());

  setLoading(isLoading: boolean): void {
    this.loadingSignal.set(isLoading);
  }

  addCandidate(candidate: Candidate): void {
    this.candidatesSignal.update((current) => [...current, candidate]);
    this.setLoading(false);
  }

  reset(): void {
    this.candidatesSignal.set([]);
    this.setLoading(false);
  }
}
