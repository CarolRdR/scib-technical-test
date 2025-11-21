import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { CandidateExcelData } from '../../../../core/interfaces/candidate.interface';
import {
  ensureSingleDataRow,
  ensureXlsxFile,
  ExcelValidationError
} from '../../../../core/utils/validators/excel-file.validator';
import { MATERIAL_IMPORTS } from '../../../../shared/imports/material.imports';
import { CandidateApiService } from '../../services/candidate-api.service';
import { CandidateStorageService } from '../../services/candidate-storage.service';

@Component({
  selector: 'app-upload-candidate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatSnackBarModule,
    ...MATERIAL_IMPORTS
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

  @ViewChild('fileInput', { static: false })
  private readonly fileInput?: ElementRef<HTMLInputElement>;

  protected readonly uploadForm = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.maxLength(80)] }),
    surname: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.maxLength(80)]
    }),
    file: this.fb.control<File | null>(null, { validators: [Validators.required] })
  });

  protected readonly isSubmitting = signal(false);
  protected readonly selectedFileName = computed(() => this.uploadForm.controls.file.value?.name ?? '');
  protected readonly hasSelectedFile = computed(() => Boolean(this.uploadForm.controls.file.value));

  protected async onSubmit(): Promise<void> {
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
      const nativeInput = this.fileInput?.nativeElement;
      if (nativeInput) {
        nativeInput.value = '';
      }
      this.snackBar.open('Candidato cargado correctamente.', 'Cerrar', { duration: 3000 });
    } catch (error) {
      this.presentError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.uploadForm.controls.file.setValue(file);
    this.uploadForm.controls.file.markAsDirty();
    this.uploadForm.controls.file.updateValueAndValidity();
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
    const message =
      error instanceof ExcelValidationError
        ? error.message
        : 'No se pudo cargar el candidato. Intenta nuevamente.';
    this.snackBar.open(message, 'Cerrar', { duration: 4000 });
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
