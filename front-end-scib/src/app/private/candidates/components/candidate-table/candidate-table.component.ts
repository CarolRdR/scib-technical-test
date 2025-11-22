import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CandidateStorageService } from '../../services/candidate-storage.service';

@Component({
  selector: 'app-candidate-table',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatProgressSpinnerModule],
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
}
