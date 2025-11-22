import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Candidate } from '../../../../core/interfaces/candidate.interface';
import { MATERIAL_IMPORTS } from '../../../../shared/imports/material.imports';
import { CandidateStorageService } from '../../services/storage/candidate-storage.service';

@Component({
  selector: 'app-candidate-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS, TranslateModule],
  templateUrl: './candidate-table.component.html',
  styleUrl: './candidate-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateTableComponent {
  private readonly candidateStorage = inject(CandidateStorageService);

  protected readonly displayedColumns = ['name', 'surname', 'seniority', 'years', 'availability'];
  protected readonly candidates = this.candidateStorage.candidates;
  protected readonly isLoading = this.candidateStorage.isLoading;
  protected readonly hasCandidates = computed(() => this.candidates().length > 0);

  protected searchTerm = '';
  private filteredCandidates: Candidate[] | null = null;

  protected get dataRows(): Candidate[] {
    return this.filteredCandidates ?? this.candidates();
  }

  public applyFilter(value: string): void {
    const normalizedInput = value ?? '';
    this.searchTerm = normalizedInput;
    const normalized = normalizedInput.trim().toLowerCase();
    if (!normalized) {
      this.filteredCandidates = null;
      return;
    }

    const current = this.candidates();
    this.filteredCandidates = current.filter((candidate) => {
      const fullName = `${candidate.name} ${candidate.surname}`.toLowerCase();
      return (
        candidate.name.toLowerCase().includes(normalized) ||
        candidate.surname.toLowerCase().includes(normalized) ||
        fullName.includes(normalized)
      );
    });
  }

  public clearSearch(): void {
    this.searchTerm = '';
    this.filteredCandidates = null;
  }
}
