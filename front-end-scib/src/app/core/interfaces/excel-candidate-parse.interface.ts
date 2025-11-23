import { CandidateExcelData } from "./candidate.interface";

export interface ExcelCandidateParseResult {
  excelData: CandidateExcelData;
  normalizedFile: File;
}
