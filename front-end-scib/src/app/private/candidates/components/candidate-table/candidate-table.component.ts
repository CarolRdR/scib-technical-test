import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Candidate } from '../../../../core/interfaces/candidate.interface';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { filterEntitiesByTerm, sortEntities } from '../../../../shared/utils/table.utils';
import { CandidateStorageService } from '../../services/storage/candidate-storage.service';
import { buildCandidateSearchConfig } from '../../utils/candidate-search.utils';

@Component({
  selector: 'app-candidate-table',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    TranslateModule,
    SearchBarComponent
  ],
  templateUrl: './candidate-table.component.html',
  styleUrl: './candidate-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateTableComponent {
  private readonly candidateStorage = inject(CandidateStorageService);
  private readonly translate = inject(TranslateService);

  protected readonly displayedColumns = ['name', 'surname', 'seniority', 'years', 'availability'];
  protected readonly candidates = this.candidateStorage.candidates;
  protected readonly isLoading = this.candidateStorage.isLoading;
  protected readonly hasCandidates = computed(() => this.candidates().length > 0);

  protected searchTerm: string = '';
  private readonly filteredCandidates = signal<Candidate[] | null>(null);
  private readonly sortState = signal<Sort>({ active: '', direction: '' });

  // Combines search and sort state to feed the table rows.
  protected readonly dataRows = computed(() => {
    const baseList = this.filteredCandidates() ?? this.candidates();
    return sortEntities(baseList, this.sortState());
  });

  // Updates the current sort state coming from matSort.
  public onSortChange(sort: Sort): void {
    this.sortState.set(sort);
  }

  // Normalizes the search term and delegates the filtering to reusable helpers.
  public applyFilter(value: string): void {
    const term = (value || '').trim().toLowerCase();
    this.searchTerm = value || '';

    if (!term) {
      this.filteredCandidates.set(null);
      return;
    }

    const current = this.candidates();
    const { projector, aliases } = buildCandidateSearchConfig(this.translate);
    this.filteredCandidates.set(filterEntitiesByTerm(current, term, projector, aliases));
  }

  // Clears any active filter restoring the full candidate list.
  public clearSearch(): void {
    this.searchTerm = '';
    this.filteredCandidates.set(null);
  }

}
