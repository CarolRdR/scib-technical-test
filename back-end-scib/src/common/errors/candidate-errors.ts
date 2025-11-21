import { BadRequestException } from '@nestjs/common';

export const candidateErrors = {
  fileHasNoData: () => new BadRequestException('Uploaded file has no data'),
  excelWithoutSheets: () =>
    new BadRequestException('Excel file does not contain sheets'),
  excelWithoutRows: () =>
    new BadRequestException('Excel file does not contain rows'),
  excelProcessingFailed: () =>
    new BadRequestException('Unable to process Excel file'),
  seniorityMustBeString: () =>
    new BadRequestException('Seniority must be a string'),
  seniorityInvalidValue: () =>
    new BadRequestException('Seniority must be "junior" or "senior"'),
  yearsInvalidValue: () =>
    new BadRequestException('Years must be a positive integer'),
  availabilityInvalidValue: () =>
    new BadRequestException('Availability must be a boolean'),
  uploadedFileInvalid: () =>
    new BadRequestException('Uploaded file payload is invalid'),
} as const;
