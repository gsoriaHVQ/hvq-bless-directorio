// Validaciones centralizadas del proyecto
import { VALIDATION_CONFIG, REGEX_PATTERNS } from './constants'

// Validación de strings
export const validateString = (value: unknown, fieldName: string): string => {
  if (value == null || value === '') {
    throw new Error(`${fieldName} es requerido`)
  }
  
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} debe ser una cadena de texto`)
  }
  
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} no puede estar vacío`)
  }
  
  return trimmed
}

// Validación de números
export const validateNumber = (value: unknown, fieldName: string): number => {
  if (value == null || value === '') {
    throw new Error(`${fieldName} es requerido`)
  }
  
  const num = Number(value)
  if (isNaN(num)) {
    throw new Error(`${fieldName} debe ser un número válido`)
  }
  
  return num
}

// Validación de IDs
export const validateId = (value: unknown, fieldName: string): string => {
  const str = validateString(value, fieldName)
  
  if (!REGEX_PATTERNS.DOCTOR_ID.test(str)) {
    throw new Error(`${fieldName} debe ser un ID válido`)
  }
  
  return str
}

// Validación de tiempo (HH:MM)
export const validateTime = (value: unknown, fieldName: string): string => {
  const str = validateString(value, fieldName)
  
  if (!REGEX_PATTERNS.TIME_HHMM.test(str)) {
    throw new Error(`${fieldName} debe tener el formato HH:MM`)
  }
  
  const [hours, minutes] = str.split(':').map(Number)
  
  if (hours < 0 || hours > 23) {
    throw new Error(`${fieldName} debe tener horas entre 0 y 23`)
  }
  
  if (minutes < 0 || minutes > 59) {
    throw new Error(`${fieldName} debe tener minutos entre 0 y 59`)
  }
  
  return str
}

// Validación de URLs
export const validateUrl = (value: unknown, fieldName: string): string => {
  const str = validateString(value, fieldName)
  
  try {
    new URL(str)
    return str
  } catch {
    throw new Error(`${fieldName} debe ser una URL válida`)
  }
}

// Validación de longitud de string
export const validateStringLength = (
  value: string, 
  fieldName: string, 
  minLength: number = VALIDATION_CONFIG.MIN_NAME_LENGTH,
  maxLength: number = VALIDATION_CONFIG.MAX_NAME_LENGTH
): string => {
  if (value.length < minLength) {
    throw new Error(`${fieldName} debe tener al menos ${minLength} caracteres`)
  }
  
  if (value.length > maxLength) {
    throw new Error(`${fieldName} debe tener máximo ${maxLength} caracteres`)
  }
  
  return value
}

// Validación de búsqueda
export const validateSearchTerm = (value: unknown, fieldName: string): string => {
  const str = validateString(value, fieldName)
  
  if (str.length < VALIDATION_CONFIG.MIN_SEARCH_LENGTH) {
    throw new Error(`${fieldName} debe tener al menos ${VALIDATION_CONFIG.MIN_SEARCH_LENGTH} caracteres`)
  }
  
  if (str.length > VALIDATION_CONFIG.MAX_SEARCH_LENGTH) {
    throw new Error(`${fieldName} debe tener máximo ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`)
  }
  
  return str
}

// Validación de email
export const validateEmail = (value: unknown, fieldName: string): string => {
  const str = validateString(value, fieldName)
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(str)) {
    throw new Error(`${fieldName} debe ser un email válido`)
  }
  
  return str.toLowerCase()
}

// Validación de teléfono
export const validatePhone = (value: unknown, fieldName: string): string => {
  const str = validateString(value, fieldName)
  
  // Remover espacios, guiones y paréntesis
  const cleanPhone = str.replace(/[\s\-\(\)]/g, '')
  
  // Validar que solo contenga números
  if (!/^\d+$/.test(cleanPhone)) {
    throw new Error(`${fieldName} debe contener solo números`)
  }
  
  // Validar longitud mínima
  if (cleanPhone.length < 7) {
    throw new Error(`${fieldName} debe tener al menos 7 dígitos`)
  }
  
  return cleanPhone
}

// Validación de fecha
export const validateDate = (value: unknown, fieldName: string): Date => {
  if (value == null || value === '') {
    throw new Error(`${fieldName} es requerido`)
  }
  
  const date = new Date(value as string)
  
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} debe ser una fecha válida`)
  }
  
  return date
}

// Validación de array
export const validateArray = <T>(
  value: unknown, 
  fieldName: string, 
  validator?: (item: unknown, index: number) => T
): T[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} debe ser un array`)
  }
  
  if (validator) {
    return value.map((item, index) => validator(item, index))
  }
  
  return value as T[]
}

// Validación de objeto
export const validateObject = <T>(
  value: unknown, 
  fieldName: string,
  schema: Record<string, (val: unknown) => any>
): T => {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${fieldName} debe ser un objeto`)
  }
  
  const result: any = {}
  
  for (const [key, validator] of Object.entries(schema)) {
    try {
      result[key] = validator((value as any)[key])
    } catch (error) {
      throw new Error(`${fieldName}.${key}: ${(error as Error).message}`)
    }
  }
  
  return result as T
}

// Función helper para validar opcional
export const validateOptional = <T>(
  value: unknown,
  validator: (val: unknown, fieldName: string) => T,
  fieldName: string
): T | undefined => {
  if (value == null || value === '') {
    return undefined
  }
  
  return validator(value, fieldName)
}

// Función helper para sanitizar strings
export const sanitizeString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }
  
  return value.trim()
}

// Función helper para sanitizar HTML
export const sanitizeHtml = (value: string): string => {
  // Remover tags HTML básicos
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}
