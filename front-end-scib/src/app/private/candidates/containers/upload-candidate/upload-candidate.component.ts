import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ERROR_MESSAGE_KEYS } from '../../../../core/constants/errors/error-messages';
import { Candidate } from '../../../../core/interfaces/candidate.interface';
import { ensureXlsxFile, ExcelValidationError } from '../../../../core/utils/validators/excel-file.validator';
import { DropFilesZoneComponent } from '../../../../shared/components/drop-files-zone/drop-files-zone';
import { HeaderComponent } from '../../../../shared/components/header/header';
import { MATERIAL_IMPORTS } from '../../../../shared/imports/material.imports';
import { CandidateTableComponent } from '../../components/candidate-table/candidate-table.component';
import { CandidateApiService } from '../../services/api/candidate-api.service';
import { ExcelCandidateParserService } from '../../services/excel/excel-candidate-parser.service';
import { CandidateStorageService } from '../../services/storage/candidate-storage.service';

@Component({
  selector: 'app-upload-candidate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatSnackBarModule,
    ...MATERIAL_IMPORTS,
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly candidateApi = inject(CandidateApiService);
  private readonly candidateStorage = inject(CandidateStorageService);
  private readonly translate = inject(TranslateService);
  private readonly excelParser = inject(ExcelCandidateParserService);

  public readonly uploadForm = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.maxLength(80)] }),
    surname: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.maxLength(80)]
    }),
    file: this.fb.control<File | null>(null, { validators: [Validators.required] })
  });

  public readonly isSubmitting = signal(false);

  ngOnInit(): void {
    void this.loadExistingCandidates();
  }

  public async onSubmit(): Promise<void> {
    if (this.uploadForm.invalid || this.isSubmitting()) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    const file = ensureXlsxFile(this.uploadForm.controls.file.value);
    let normalizedFile: File;
    try {
      const { normalizedFile: parsedFile } = await this.excelParser.parseCandidateFile(file);
      normalizedFile = parsedFile;
    } catch (error) {
      this.presentError(error);
      return;
    }

    this.isSubmitting.set(true);
    this.candidateStorage.setLoading(true);

    try {
      const candidate = await firstValueFrom(
        this.candidateApi.uploadCandidate({
          name: this.uploadForm.controls.name.value,
          surname: this.uploadForm.controls.surname.value,
          file: normalizedFile
        })
      );
      this.candidateStorage.addCandidate(candidate);
      this.uploadForm.reset({ name: '', surname: '', file: null });
      this.notifySuccess(candidate);
    } catch (error) {
      this.presentError(error);
    } finally {
      this.isSubmitting.set(false);
      this.candidateStorage.setLoading(false);
    }
  }

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

  private notifySuccess(candidate: Candidate): void {
    const successMessage = this.translate.instant('UPLOAD_CANDIDATE.SNACKBAR_SUCCESS', {
      name: candidate.name,
      surname: candidate.surname
    });
    const closeLabel = this.translate.instant('COMMON.CLOSE');
    this.snackBar.open(successMessage, closeLabel, {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  private presentError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      // Global interceptor handles HTTP errors.
      return;
    }

    const key =
      error instanceof ExcelValidationError ? error.translationKey : ERROR_MESSAGE_KEYS.general.unknown;
    const message = this.translate.instant(key);
    const closeLabel = this.translate.instant('COMMON.CLOSE');
    this.snackBar.open(message, closeLabel, { duration: 4000, panelClass: ['snackbar-error'] });
  }

}
