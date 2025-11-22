export const ERROR_MESSAGES = {
  upload: {
    default: 'No se pudo cargar el candidato. Intenta nuevamente.',
    availability: 'Disponibilidad inválida. Asegúrate de utilizar valores booleanos.',
    years: 'Los años de experiencia deben ser un número positivo.',
    file: 'No se pudo leer el archivo. Verifica el formato.'
  },
  general: {
    unknown: 'Ha ocurrido un error inesperado.'
  }
} as const;

export const BACKEND_ERROR_MESSAGE_MAP: Record<string, string> = {
  'Availability must be a boolean': ERROR_MESSAGES.upload.availability,
  'Years must be a positive integer': ERROR_MESSAGES.upload.years,
  'Excel file is required': ERROR_MESSAGES.upload.file,
  'Excel payload is invalid': ERROR_MESSAGES.upload.file
};
