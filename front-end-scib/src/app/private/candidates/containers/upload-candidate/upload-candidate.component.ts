import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ERROR_MESSAGE_KEYS } from '../../../../core/constants/errors/error-messages';
import { Candidate, CandidateUploadPayload, UploadCandidateForm } from '../../../../core/interfaces/candidate.interface';
import { ExcelCandidateParserService } from '../../../../core/services/excel/excel-candidate-parser.service';
import { ensureXlsxFile, ExcelValidationError } from '../../../../core/utils/validators/excel-file.validator';
import { DropFilesZoneComponent } from '../../../../shared/components/drop-files-zone/drop-files-zone';
import { HeaderComponent } from '../../../../shared/components/header/header';
import { NotificationService } from '../../../../shared/services/notification.service';
import { CandidateTableComponent } from '../../components/candidate-table/candidate-table.component';
import { CandidateApiService } from '../../services/api/candidate-api.service';
import { CandidateStorageService } from '../../services/storage/candidate-storage.service';

@Component({
  selector: 'app-upload-candidate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    CandidateTableComponent,
    DropFilesZoneComponent,
    TranslateModule,
    HeaderComponent
  ],
  templateUrl: './upload-candidate.component.html',
  styleUrl: './upload-candidate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadCandidateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly candidateApi = inject(CandidateApiService);
  private readonly candidateStorage = inject(CandidateStorageService);
  private readonly excelParser = inject(ExcelCandidateParserService);
  private readonly notifications = inject(NotificationService);

  public readonly uploadForm: UploadCandidateForm = this.fb.group({
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.maxLength(80)] }),
    surname: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.maxLength(80)]
    }),
    file: this.fb.control<File | null>(null, { validators: [Validators.required] })
  }) as UploadCandidateForm;

  public readonly isSubmitting = signal(false);

  // Initializes component data when view loads; fire-and-forget because the helper handles storing state.
  ngOnInit(): void {
    void this.loadExistingCandidates();
  }

  // Typed shortcut to access form controls.
  private get controls(): UploadCandidateForm['controls'] {
    return this.uploadForm.controls;
  }

  // Handles user submission by preparing payload and persisting candidate.
  public async onSubmit(): Promise<void> {
    if (this.uploadForm.invalid || this.isSubmitting()) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    let payload: CandidateUploadPayload;
    try {
      payload = await this.preparePayload();
    } catch (error) {
      this.presentError(error);
      return;
    }

    await this.withSubmission(() => this.persistCandidate(payload));
  }

  // Fetches existing candidates to hydrate storage/table.
  private async loadExistingCandidates(): Promise<void> {
    this.candidateStorage.setLoading(true);
    try {
      const candidates = await firstValueFrom(this.candidateApi.listCandidates());
      this.candidateStorage.setCandidates(candidates);
    } catch (error) {
      this.presentError(error);
    } finally {
      this.candidateStorage.setLoading(false);
    }
  }

  // Shows translated success snackbar when new candidate is added.
  private notifySuccess(candidate: Candidate): void {
    this.notifications.showSuccess('UPLOAD_CANDIDATE.SNACKBAR_SUCCESS', {
      name: candidate.name,
      surname: candidate.surname
    });
  }

  // Displays translated error snackbar unless HTTP layer already handled it.
  private presentError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      // Global interceptor handles HTTP errors.
      return;
    }

    const key =
      error instanceof ExcelValidationError ? error.translationKey : ERROR_MESSAGE_KEYS.general.unknown;
    this.notifications.showError(key);
  }

  // Builds upload payload ensuring file is normalized and form values gathered.
  private async preparePayload(): Promise<CandidateUploadPayload> {
    const { name, surname, file } = this.controls;
    const ensuredFile = ensureXlsxFile(file.value);
    const { normalizedFile } = await this.excelParser.parseCandidateFile(ensuredFile);

    return {
      name: name.value,
      surname: surname.value,
      file: normalizedFile
    };
  }

  // Calls API, updates store, resets form and notifies success.
  private async persistCandidate(payload: CandidateUploadPayload): Promise<void> {
    const candidate = await firstValueFrom(this.candidateApi.uploadCandidate(payload));
    this.candidateStorage.addCandidate(candidate);
    this.uploadForm.reset({ name: '', surname: '', file: null });
    this.notifySuccess(candidate);
  }

  // Wraps async operation toggling submitting/loading flags automatically.
  private async withSubmission<T>(operation: () => Promise<T>): Promise<T> {
    this.isSubmitting.set(true);
    this.candidateStorage.setLoading(true);
    try {
      return await operation();
    } catch (error) {
      this.presentError(error);
      throw error;
    } finally {
      this.isSubmitting.set(false);
      this.candidateStorage.setLoading(false);
    }
  }

}
