import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MATERIAL_IMPORTS } from '../../../../shared/imports/material.imports';
import { CandidateStorageService } from '../../services/storage/candidate-storage.service';

@Component({
  selector: 'app-candidate-table',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_IMPORTS, TranslateModule],
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
