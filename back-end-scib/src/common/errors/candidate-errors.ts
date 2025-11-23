import { BadRequestException } from '@nestjs/common';

const describeValue = (value: unknown): string => {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  return String(value);
};

export const candidateErrors = {
  fileHasNoData: () => new BadRequestException('Uploaded file has no data'),
  excelWithoutSheets: () =>
    new BadRequestException('Excel file does not contain sheets'),
  excelWithoutRows: () =>
    new BadRequestException('Excel file does not contain rows'),
  excelProcessingFailed: () =>
    new BadRequestException('Unable to process Excel file'),
  seniorityMustBeString: (value: unknown) =>
    new BadRequestException(
      `Column "seniority" must be a string. Received: ${describeValue(value)}.`,
    ),
  seniorityInvalidValue: (value: unknown) =>
    new BadRequestException(
      `Column "seniority" must be "junior" or "senior". Received: ${describeValue(value)}.`,
    ),
  yearsInvalidValue: (value: unknown) =>
    new BadRequestException(
      `Column "years" must be a positive integer. Received: ${describeValue(value)}.`,
    ),
  availabilityInvalidValue: (value: unknown) =>
    new BadRequestException(
      `Column "availability" must be boolean ("true"/"false"). Received: ${describeValue(value)}.`,
    ),
  uploadedFileInvalid: () =>
    new BadRequestException('Uploaded file payload is invalid'),
} as const;
