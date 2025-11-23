import { Injectable, computed, signal } from '@angular/core';
import { Candidate } from '../../../../core/interfaces/candidate.interface';

@Injectable({
  providedIn: 'root'
})
export class CandidateStorageService {
  private readonly candidatesSignal = signal<Candidate[]>([]);
  private readonly loadingSignal = signal(false);

  readonly candidates = computed(() => this.candidatesSignal());
  readonly isLoading = computed(() => this.loadingSignal());

  public setCandidates(candidates: Candidate[]): void {
    this.candidatesSignal.set(candidates);
  }

  public setLoading(isLoading: boolean): void {
    this.loadingSignal.set(isLoading);
  }

  public addCandidate(candidate: Candidate): void {
    this.candidatesSignal.update((current) => [...current, candidate]);
  }

  public reset(): void {
    this.candidatesSignal.set([]);
  }
}
