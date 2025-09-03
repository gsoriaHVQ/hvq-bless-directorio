// Constantes centralizadas del proyecto

// Días de la semana
export const DAYS_OF_WEEK = [
  'lunes',
  'martes', 
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo'
] as const

export type DayOfWeek = typeof DAYS_OF_WEEK[number]

// Tipos de consulta
export const CONSULTA_TYPES = {
  CONSULTA: 'C',
  PROCEDIMIENTO: 'P'
} as const

export type ConsultaType = typeof CONSULTA_TYPES[keyof typeof CONSULTA_TYPES]

// Textos de tipos de consulta
export const CONSULTA_TYPE_LABELS = {
  [CONSULTA_TYPES.CONSULTA]: 'Consulta',
  [CONSULTA_TYPES.PROCEDIMIENTO]: 'Procedimiento'
} as const

// Mapeo de códigos de día a nombres
export const DAY_CODE_MAP: Record<string, string> = {
  '1': 'Lunes',
  '2': 'Martes', 
  '3': 'Miércoles',
  '4': 'Jueves',
  '5': 'Viernes',
  '6': 'Sábado',
  '7': 'Domingo',
  'L': 'Lunes',
  'M': 'Martes',
  'X': 'Miércoles',
  'J': 'Jueves',
  'V': 'Viernes',
  'S': 'Sábado',
  'D': 'Domingo',
  'LUNES': 'Lunes',
  'MARTES': 'Martes',
  'MIERCOLES': 'Miércoles',
  'MIÉRCOLES': 'Miércoles',
  'JUEVES': 'Jueves',
  'VIERNES': 'Viernes',
  'SABADO': 'Sábado',
  'SÁBADO': 'Sábado',
  'DOMINGO': 'Domingo'
}

// Claves de caché
export const CACHE_KEYS = {
  SPECIALTIES: 'specialties_agenda_cache_v1',
  DOCTORS: 'doctors_cache_v1',
  AGENDAS: 'agendas_cache_v1',
  CONSULTORIOS: 'consultorios_cache_v1',
  EDIFICIOS: 'edificios_cache_v1',
  DIAS: 'dias_cache_v1'
} as const

// Patrones de regex
export const REGEX_PATTERNS = {
  TIME_HHMM: /^(\d{2}):(\d{2})$/,
  TIME_HHMMSS: /^(\d{2}):(\d{2}):(\d{2})$/,
  TIME_NUMERIC: /^\d{3,4}$/,
  DOCTOR_ID: /^\d+$/,
  DATE_ISO: /\b\d{4}-\d{2}-\d{2}[ T](\d{2}:\d{2})\b/,
  DATE_ISO_FULL: /\b\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?\b/
} as const

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
  TIMEOUT_ERROR: 'La operación tardó demasiado. Intente nuevamente.',
  UNAUTHORIZED: 'No autorizado. Por favor, inicie sesión nuevamente.',
  FORBIDDEN: 'Acceso denegado.',
  NOT_FOUND: 'Recurso no encontrado.',
  SERVER_ERROR: 'Error del servidor. Intente más tarde.',
  UNKNOWN_ERROR: 'Error inesperado. Intente nuevamente.',
  LOADING_SPECIALTIES: 'Error al cargar las especialidades. Intente nuevamente más tarde.',
  LOADING_DOCTORS: 'Error al cargar los doctores. Intente nuevamente más tarde.',
  LOADING_AGENDAS: 'Error al cargar las agendas. Intente nuevamente más tarde.',
  SPECIALTY_NOT_FOUND: 'Especialidad no encontrada',
  DOCTOR_NOT_FOUND: 'Médico no encontrado'
} as const

// Valores por defecto
export const DEFAULT_VALUES = {
  DOCTOR_NAME: 'Nombre no disponible',
  SPECIALTY_NAME: 'Especialidad no disponible',
  ROOM_NAME: 'No especificado',
  BUILDING_NAME: 'No especificado',
  FLOOR_NAME: 'No especificado',
  EMPTY_MESSAGE: 'No se encontraron resultados.',
  SEARCH_PLACEHOLDER: 'Buscar especialidad...',
  DOCTOR_SEARCH_PLACEHOLDER: 'Buscar doctor...'
} as const

// Configuración de UI
export const UI_CONFIG = {
  SCROLL_TOP_THRESHOLD: 200,
  IDLE_TIMEOUT: 30000,
  SEARCH_DEBOUNCE: 300,
  ANIMATION_DURATION: 300,
  MAX_SEARCH_RESULTS: 50
} as const

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
} as const

// Configuración de validación
export const VALIDATION_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 200
} as const
