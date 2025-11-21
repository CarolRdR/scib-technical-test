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
