export const ERROR_MESSAGE_KEYS = {
  upload: {
    default: 'ERRORS.UPLOAD_DEFAULT',
    availability: 'ERRORS.UPLOAD_AVAILABILITY',
    years: 'ERRORS.UPLOAD_YEARS',
    file: 'ERRORS.UPLOAD_FILE'
  },
  general: {
    unknown: 'ERRORS.UPLOAD_UNKNOWN'
  }
} as const;

export const BACKEND_ERROR_MESSAGE_KEYS_MAP: Record<string, string> = {
  'Availability must be a boolean': ERROR_MESSAGE_KEYS.upload.availability,
  'Years must be a positive integer': ERROR_MESSAGE_KEYS.upload.years,
  'Excel file is required': ERROR_MESSAGE_KEYS.upload.file,
  'Excel payload is invalid': ERROR_MESSAGE_KEYS.upload.file
};
