// Manejo centralizado de caché
import type { CacheEntry } from './types'

// Clase para manejar caché en memoria
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  // Obtener un valor del caché
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Verificar si el caché ha expirado
    if (Date.now() > entry.ts) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  // Guardar un valor en el caché
  set<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      ts: Date.now() + ttl,
      data
    }
    this.cache.set(key, entry)
  }

  // Eliminar un valor del caché
  delete(key: string): void {
    this.cache.delete(key)
  }

  // Limpiar todo el caché
  clear(): void {
    this.cache.clear()
  }

  // Verificar si existe una clave
  has(key: string): boolean {
    return this.cache.has(key)
  }

  // Obtener el tamaño del caché
  size(): number {
    return this.cache.size
  }
}

// Instancia global del caché en memoria
export const memoryCache = new MemoryCache()

// Función para manejar caché en sessionStorage
export const sessionCache = {
  // Obtener un valor del sessionStorage
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    
    try {
      const item = sessionStorage.getItem(key)
      if (!item) return null
      
      const entry: CacheEntry<T> = JSON.parse(item)
      
      // Verificar si el caché ha expirado
      if (Date.now() > entry.ts) {
        sessionStorage.removeItem(key)
        return null
      }
      
      return entry.data
    } catch {
      return null
    }
  },

  // Guardar un valor en sessionStorage
  set<T>(key: string, data: T, ttl: number): void {
    if (typeof window === 'undefined') return
    
    try {
      const entry: CacheEntry<T> = {
        ts: Date.now() + ttl,
        data
      }
      sessionStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // Si sessionStorage falla, usar caché en memoria como fallback
      memoryCache.set(key, data, ttl)
    }
  },

  // Eliminar un valor del sessionStorage
  delete(key: string): void {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(key)
  },

  // Limpiar todo el sessionStorage
  clear(): void {
    if (typeof window === 'undefined') return
    sessionStorage.clear()
  }
}

// Función para manejar caché en localStorage
export const localCache = {
  // Obtener un valor del localStorage
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const entry: CacheEntry<T> = JSON.parse(item)
      
      // Verificar si el caché ha expirado
      if (Date.now() > entry.ts) {
        localStorage.removeItem(key)
        return null
      }
      
      return entry.data
    } catch {
      return null
    }
  },

  // Guardar un valor en localStorage
  set<T>(key: string, data: T, ttl: number): void {
    if (typeof window === 'undefined') return
    
    try {
      const entry: CacheEntry<T> = {
        ts: Date.now() + ttl,
        data
      }
      localStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // Si localStorage falla, usar caché en memoria como fallback
      memoryCache.set(key, data, ttl)
    }
  },

  // Eliminar un valor del localStorage
  delete(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },

  // Limpiar todo el localStorage
  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }
}

// Función helper para obtener caché con fallback
export const getCacheWithFallback = <T>(
  key: string, 
  ttl: number,
  fallback: () => Promise<T>
): Promise<T> => {
  // Intentar obtener del sessionStorage primero
  const cached = sessionCache.get<T>(key)
  if (cached) return Promise.resolve(cached)
  
  // Si no está en sessionStorage, intentar memoria
  const memoryCached = memoryCache.get<T>(key)
  if (memoryCached) return Promise.resolve(memoryCached)
  
  // Si no está en ningún caché, ejecutar fallback
  return fallback().then(data => {
    // Guardar en ambos cachés
    sessionCache.set(key, data, ttl)
    memoryCache.set(key, data, ttl)
    return data
  })
}
