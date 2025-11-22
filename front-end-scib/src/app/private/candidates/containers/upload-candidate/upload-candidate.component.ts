import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { ERROR_MESSAGE_KEYS } from '../../../../core/constants/error-messages';
import { CandidateExcelData } from '../../../../core/interfaces/candidate.interface';
import {
  ensureSingleDataRow,
  ensureXlsxFile,
  ExcelValidationError
} from '../../../../core/utils/validators/excel-file.validator';
import { DropFilesZoneComponent } from '../../../../shared/components/drop-files-zone/drop-files-zone';
import { MATERIAL_IMPORTS } from '../../../../shared/imports/material.imports';
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
    ...MATERIAL_IMPORTS,
    CandidateTableComponent,
    DropFilesZoneComponent,
    TranslateModule
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

  public readonly uploadForm = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.maxLength(80)] }),
    surname: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.maxLength(80)]
    }),
    file: this.fb.control<File | null>(null, { validators: [Validators.required] })
  });

  public readonly isSubmitting = signal(false);

  public async onSubmit(): Promise<void> {
    if (this.uploadForm.invalid || this.isSubmitting()) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    const file = ensureXlsxFile(this.uploadForm.controls.file.value);
    let excelData: CandidateExcelData;
    let normalizedFile = file;
    try {
      const rows = await this.extractExcelRows(file);
      excelData = ensureSingleDataRow(rows);
      normalizedFile = this.normalizeExcelFile(excelData, file);
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
      const successMessage = this.translate.instant('UPLOAD_CANDIDATE.SNACKBAR_SUCCESS');
      const closeLabel = this.translate.instant('COMMON.CLOSE');
      this.snackBar.open(successMessage, closeLabel, {
        duration: 3000,
        panelClass: ['snackbar-success']
      });
    } catch (error) {
      this.presentError(error);
    } finally {
      this.isSubmitting.set(false);
      this.candidateStorage.setLoading(false);
    }
  }

  private async extractExcelRows(file: File): Promise<CandidateExcelData[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const [firstSheetName] = workbook.SheetNames;

    if (!firstSheetName) {
      throw new ExcelValidationError('El archivo no contiene hojas.');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    return rawRows.map((row) => this.mapRowToCandidateData(row));
  }

  private mapRowToCandidateData(row: Record<string, unknown>): CandidateExcelData {
    const normalizedRow = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
      const normalizedKey = key
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .toLowerCase();
      acc[normalizedKey] = value;
      return acc;
    }, {});

    const seniorityValue = String(normalizedRow['seniority'] ?? '').toLowerCase().trim();
    if (seniorityValue !== 'junior' && seniorityValue !== 'senior') {
      throw new ExcelValidationError('El campo "Seniority" debe ser "junior" o "senior".');
    }

    const yearsRaw =
      normalizedRow['years'] ??
      normalizedRow['anosdeexperiencia'] ??
      normalizedRow['anosexperiencia'] ??
      normalizedRow['experiencia'] ??
      normalizedRow['yearsofexperience'];
    const years = Number(yearsRaw);
    if (!Number.isFinite(years) || years < 0) {
      throw new ExcelValidationError('El campo "Años de experiencia" debe ser un número válido.');
    }

    const availabilityRaw = normalizedRow['availability'] ?? normalizedRow['disponibilidad'];
    if (availabilityRaw === undefined || availabilityRaw === null || availabilityRaw === '') {
      throw new ExcelValidationError('La columna "Disponibilidad" es obligatoria.');
    }

    let availability: boolean;
    if (typeof availabilityRaw === 'boolean') {
      availability = availabilityRaw;
    } else {
      const normalizedAvailability = String(availabilityRaw).toLowerCase().trim();
      if (['true', '1', 'si', 'sí', 'available', 'disponible', 'yes'].includes(normalizedAvailability)) {
        availability = true;
      } else if (['false', '0', 'no', 'notavailable', 'no disponible'].includes(normalizedAvailability)) {
        availability = false;
      } else {
        throw new ExcelValidationError('La columna "Disponibilidad" debe ser booleana.');
      }
    }

    return {
      seniority: seniorityValue as CandidateExcelData['seniority'],
      years,
      availability
    };
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

  private normalizeExcelFile(excelData: CandidateExcelData, originalFile: File): File {
    const worksheet = XLSX.utils.json_to_sheet(
      [
        {
          seniority: excelData.seniority,
          years: excelData.years,
          availability: excelData.availability
        }
      ],
      { header: ['seniority', 'years', 'availability'] }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'candidate');
    const normalizedBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;

    return new File([normalizedBuffer], originalFile.name, {
      type:
        originalFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      lastModified: originalFile.lastModified
    });
  }
}
