import { FormControl, FormGroup } from '@angular/forms';

export type CandidateSeniority = 'junior' | 'senior';

export interface CandidateExcelData {
  seniority: CandidateSeniority;
  years: number;
  availability: boolean;
}

export interface CandidateFormValue extends CandidateExcelData {
  name: string;
  surname: string;
  file: File;
}

export type Candidate = Omit<CandidateFormValue, 'file'>;
export type CandidateUploadPayload = Pick<CandidateFormValue, 'name' | 'surname' | 'file'>;
export type UploadCandidateForm = FormGroup<{
  name: FormControl<string>;
  surname: FormControl<string>;
  file: FormControl<File | null>;
}>;
