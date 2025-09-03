// Manejo centralizado de errores
import type { AppError } from './types'

// Función para crear errores de aplicación
export const createAppError = (message: string, code?: string, details?: unknown): AppError => {
  return {
    message,
    code,
    details
  }
}

// Función para manejar errores de red
export const handleNetworkError = (error: unknown): AppError => {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return createAppError('La solicitud fue cancelada por tiempo de espera', 'TIMEOUT')
    }
    if (error.message.includes('fetch')) {
      return createAppError('Error de conexión. Verifique su conexión a internet.', 'NETWORK_ERROR')
    }
    return createAppError(error.message, 'UNKNOWN_ERROR')
  }
  
  return createAppError('Error desconocido', 'UNKNOWN_ERROR')
}

// Función para manejar errores de API
export const handleApiError = (error: unknown): AppError => {
  if (error instanceof Error) {
    // Errores específicos de la API
    if (error.message.includes('401')) {
      return createAppError('No autorizado. Por favor, inicie sesión nuevamente.', 'UNAUTHORIZED')
    }
    if (error.message.includes('403')) {
      return createAppError('Acceso denegado.', 'FORBIDDEN')
    }
    if (error.message.includes('404')) {
      return createAppError('Recurso no encontrado.', 'NOT_FOUND')
    }
    if (error.message.includes('500')) {
      return createAppError('Error del servidor. Intente más tarde.', 'SERVER_ERROR')
    }
    
    return createAppError(error.message, 'API_ERROR')
  }
  
  return createAppError('Error de la API', 'API_ERROR')
}

// Función para validar datos
export const validateRequired = (value: unknown, fieldName: string): void => {
  if (value == null || value === '') {
    throw new Error(`${fieldName} es requerido`)
  }
}

export const validateString = (value: unknown, fieldName: string): void => {
  validateRequired(value, fieldName)
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} debe ser una cadena de texto`)
  }
}

export const validateNumber = (value: unknown, fieldName: string): void => {
  validateRequired(value, fieldName)
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} debe ser un número válido`)
  }
}

// Función para sanitizar strings
export const sanitizeString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

// Función para validar URLs
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Función para formatear mensajes de error para el usuario
export const formatErrorMessage = (error: AppError): string => {
  // En producción, podríamos tener un sistema de traducción
  const errorMessages: Record<string, string> = {
    'TIMEOUT': 'La operación tardó demasiado. Intente nuevamente.',
    'NETWORK_ERROR': 'Error de conexión. Verifique su conexión a internet.',
    'UNAUTHORIZED': 'No autorizado. Por favor, inicie sesión nuevamente.',
    'FORBIDDEN': 'Acceso denegado.',
    'NOT_FOUND': 'Recurso no encontrado.',
    'SERVER_ERROR': 'Error del servidor. Intente más tarde.',
    'API_ERROR': 'Error en la comunicación con el servidor.',
    'UNKNOWN_ERROR': 'Error inesperado. Intente nuevamente.'
  }
  
  return errorMessages[error.code || 'UNKNOWN_ERROR'] || error.message
}
