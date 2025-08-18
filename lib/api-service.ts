// API Service for Hospital Vozandes Quito Medical Scheduling System
// Conectado al backend real en puerto 3001

// Tipos mínimos para evitar dependencias externas. Amplíalos si es necesario.
export interface Doctor { [key: string]: unknown }
export interface Agenda { [key: string]: unknown }
export interface Edificio { [key: string]: unknown }

export interface ConsultorioNormalizado {
  codigo_consultorio: string
  codigo_edificio?: string
  piso?: string | number
  descripcion_consultorio?: string
  // Campo crudo original por si se requiere depurar
  __raw?: Record<string, unknown>
}

export interface AgendaDetallada {
  // Origen directo de AGND_AGENDA
  codigo_item_agendamiento?: string | number
  codigo_prestador?: string | number
  codigo_dia?: string | number
  hora_inicio?: string | number
  hora_fin?: string | number
  tipo?: string
  codigo_consultorio?: string | number

  // Derivados / decodificados
  especialidad?: string // primer elemento de doctor.especialidades
  medico?: string // doctor.nombres
  diaNombre?: string // Lunes..Domingo
  horaInicioHHmm?: string // HH:mm
  horaFinHHmm?: string // HH:mm
  consultorioDescripcion?: string
  consultorioCodigo?: string
  edificioDescripcion?: string
  tipoTexto?: string // Consulta / Procedimiento

  // Extras útiles para UI
  piso?: string | number
  buildingCode?: string
}

// Configuración para conectar con el backend real
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://10.129.180.151:3001',
  TIMEOUT: 30000, // 30 segundos
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// API Response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

class ApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  // Método helper para hacer requests al backend real
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...options.headers
      },
      ...options
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // No lanzar excepción: devolver un objeto de error controlado
        const errorData = await response
          .json()
          .catch(async () => ({ message: await response.text().catch(() => '') }))

        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: null as any as T,
          success: false,
          message: (errorData as any)?.message || `HTTP error ${response.status}`,
        }
      }

      // Intentar parsear JSON; si falla, devolver texto como data
      let data: unknown
      try {
        data = await response.json()
      } catch {
        data = await response.text().catch(() => null)
      }
      
      // Log para debug
      // console.log(`API Response for ${endpoint}:`, data)

      return {
        data: data as T,
        success: true
      }
    } catch (error) {
      // Suavizar logging para evitar ruido en consola
      // console.warn(`API Error (${endpoint}):`, error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: null as any as T,
          success: false,
          message: 'Request timeout'
        }
      }

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: null as any as T,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ===== ENDPOINTS DE INFORMACIÓN =====
  async getApiInfo(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('/')
  }

  async getHealth(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('/health')
  }

  // ===== ENDPOINTS DE MÉDICOS =====
  async getDoctors(): Promise<ApiResponse<Doctor[]>> {
    return this.request<Doctor[]>('/api/medicos')
  }

  async getSpecialties(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/api/medicos/especialidades')
  }

  async getDoctorsBySpecialty(especialidad: string): Promise<ApiResponse<Doctor[]>> {
    return this.request<Doctor[]>(`/api/medicos/especialidad/${encodeURIComponent(especialidad)}`)
  }

  async getDoctorByCode(codigo: string): Promise<ApiResponse<Doctor>> {
    return this.request<Doctor>(`/api/medicos/item/${encodeURIComponent(codigo)}`)
  }

  async getDoctorByName(nombre: string): Promise<ApiResponse<Doctor[]>> {
    return this.request<Doctor[]>(`/api/medicos/nombre/${encodeURIComponent(nombre)}`)
  }

  async getDoctorStats(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('/api/medicos/estadisticas')
  }

  // ===== ENDPOINTS DE AGENDAS =====
  async getAgendas(): Promise<ApiResponse<Agenda[]>> {
    return this.request<Agenda[]>('/api/agnd-agenda')
  }

  async getAgenda(id: number): Promise<ApiResponse<Agenda>> {
    return this.request<Agenda>(`/api/agnd-agenda/${id}`)
  }

  async getAgendasByProvider(codigo: string): Promise<ApiResponse<Agenda[]>> {
    return this.request<Agenda[]>(`/api/agnd-agenda?codigo_prestador=${encodeURIComponent(codigo)}`)
  }

  async getAgendaStats(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('/api/agnd-agenda/estadisticas')
  }

  // ===== ENDPOINTS DE CATÁLOGOS =====
  async getConsultorios(): Promise<ApiResponse<unknown[]>> {
    return this.request<unknown[]>('/api/catalogos/consultorios')
  }

  async getDays(): Promise<ApiResponse<unknown[]>> {
    return this.request<unknown[]>('/api/catalogos/dias')
  }

  async getBuildings(): Promise<ApiResponse<Edificio[]>> {
    return this.request<Edificio[]>('/api/catalogos/edificios')
  }

  async getBuildingFloors(codigo: string): Promise<ApiResponse<string[]>> {
    return this.request<string[]>(`/api/catalogos/edificios/${encodeURIComponent(codigo)}/pisos`)
  }

  // ===== ENDPOINTS DE AGENDA PERSONALIZADA =====
  async getCustomAgendas(): Promise<ApiResponse<Agenda[]>> {
    return this.request<Agenda[]>('/api/agnd-agenda')
  }

  // ===== ORQUESTACIÓN: AGENDAS DETALLADAS POR MÉDICO =====
  /**
   * Retorna las agendas enriquecidas para un médico/código de prestador, combinando:
   * - AGND_AGENDA (/api/agnd-agenda)
   * - MÉDICOS (/api/medicos)
   * - CONSULTORIOS (/api/catalogos/consultorios)
   * - EDIFICIOS (/api/catalogos/edificios)
   * - DÍAS (/api/catalogos/dias)
   */
  async getAgendasDetalladasPorMedico(codigoPrestador: string | number): Promise<ApiResponse<AgendaDetallada[]>> {
    // Cargar en paralelo
    const [agendasRes, medicosRes, consultoriosRes, edificiosRes, diasRes] = await Promise.all([
      this.getAgendasByProvider(String(codigoPrestador)),
      this.getDoctors(),
      this.getConsultorios(),
      this.getBuildings(),
      this.getDays()
    ])

    // Normalizar listas de data ya que el backend puede envolver en { data }
    const agendasFromProv: Record<string, unknown>[] = Array.isArray(agendasRes.data)
      ? (agendasRes.data as Record<string, unknown>[])
      : (Array.isArray((agendasRes.data as any)?.data) ? ((agendasRes.data as any).data as Record<string, unknown>[]) : [])

    const medicos: Record<string, unknown>[] = Array.isArray(medicosRes.data)
      ? (medicosRes.data as Record<string, unknown>[])
      : (Array.isArray((medicosRes.data as any)?.data) ? ((medicosRes.data as any).data as Record<string, unknown>[]) : [])

    const consultoriosRaw: Record<string, unknown>[] = Array.isArray(consultoriosRes.data)
      ? (consultoriosRes.data as Record<string, unknown>[])
      : (Array.isArray((consultoriosRes.data as any)?.data) ? ((consultoriosRes.data as any).data as Record<string, unknown>[]) : [])

    const edificios: Record<string, unknown>[] = Array.isArray(edificiosRes.data)
      ? (edificiosRes.data as Record<string, unknown>[])
      : (Array.isArray((edificiosRes.data as any)?.data) ? ((edificiosRes.data as any).data as Record<string, unknown>[]) : [])

    const diasCatalogo: Record<string, unknown>[] = Array.isArray(diasRes.data)
      ? (diasRes.data as Record<string, unknown>[])
      : (Array.isArray((diasRes.data as any)?.data) ? ((diasRes.data as any).data as Record<string, unknown>[]) : [])

    // Normalizar consultorios desde API (acepta CD_CONSULTORIO/CD_EDIFICIO/CD_PISO/DES_CONSULTORIO)
    const normalizarConsultorio = (c: Record<string, unknown>): ConsultorioNormalizado => {
      const codigo = String(
        (c as any).codigo ?? (c as any).id ?? (c as any).codigo_consultorio ?? (c as any).CD_CONSULTORIO ?? ''
      )
      const edificio = String(
        (c as any).codigo_edificio ?? (c as any).edificio ?? (c as any).CD_EDIFICIO ?? ''
      )
      const piso = (c as any).piso ?? (c as any).CD_PISO
      const descripcion = (c as any).descripcion ?? (c as any).nombre ?? (c as any).DES_CONSULTORIO
      return {
        codigo_consultorio: codigo,
        codigo_edificio: edificio || undefined,
        piso: piso as any,
        descripcion_consultorio: descripcion ? String(descripcion) : undefined,
        __raw: c
      }
    }

    const consultorioPorCodigo = new Map<string, ConsultorioNormalizado>()
    consultoriosRaw.forEach((c) => {
      const norm = normalizarConsultorio(c)
      if (norm.codigo_consultorio) consultorioPorCodigo.set(norm.codigo_consultorio, norm)
    })

    const edificioPorCodigo = new Map<string, Record<string, unknown>>()
    edificios.forEach((e) => {
      const codigo = String((e as any).codigo ?? (e as any).id ?? '')
      if (codigo) edificioPorCodigo.set(codigo, e)
    })

    const diaNombrePorCodigo = new Map<string, string>()
    diasCatalogo.forEach((d) => {
      const codigo = String((d as any).codigo ?? (d as any).id ?? '')
      const nombre = String((d as any).nombre ?? (d as any).descripcion ?? (d as any).name ?? '')
      if (codigo) diaNombrePorCodigo.set(codigo, nombre)
    })

    const decodeDiaNombre = (codigoDia: unknown): string => {
      const code = String(codigoDia ?? '').trim()
      if (!code) return ''
      const fromCatalog = diaNombrePorCodigo.get(code)
      if (fromCatalog) return String(fromCatalog)
      const upper = code.toUpperCase()
      const numberMap: Record<string, string> = {
        '1': 'Lunes', '2': 'Martes', '3': 'Miércoles', '4': 'Jueves', '5': 'Viernes', '6': 'Sábado', '7': 'Domingo'
      }
      if (numberMap[upper]) return numberMap[upper]
      const letterMap: Record<string, string> = {
        'L': 'Lunes', 'M': 'Martes', 'X': 'Miércoles', 'J': 'Jueves', 'V': 'Viernes', 'S': 'Sábado', 'D': 'Domingo'
      }
      if (letterMap[upper]) return letterMap[upper]
      const fullEsMap: Record<string, string> = {
        'LUNES': 'Lunes', 'MARTES': 'Martes', 'MIERCOLES': 'Miércoles', 'MIÉRCOLES': 'Miércoles',
        'JUEVES': 'Jueves', 'VIERNES': 'Viernes', 'SABADO': 'Sábado', 'SÁBADO': 'Sábado', 'DOMINGO': 'Domingo'
      }
      if (fullEsMap[upper]) return fullEsMap[upper]
      return code
    }

    const medicoPorId = new Map<string, Record<string, unknown>>()
    medicos.forEach((m) => {
      const id = String((m as any).id ?? (m as any).codigo ?? (m as any).codigoPrestador ?? (m as any).codigo_prestador ?? '')
      if (id) medicoPorId.set(id, m)
    })

    const toHHmm = (value: unknown): string => {
      if (value == null) return ''
      const str = String(value).trim()
      if (!str) return ''
      // HH:mm
      if (/^\d{2}:\d{2}$/.test(str)) return str
      // HH:mm:ss -> HH:mm
      if (/^\d{2}:\d{2}:\d{2}$/.test(str)) return str.slice(0, 5)
      // 830 -> 08:30, 1330 -> 13:30
      if (/^\d{3,4}$/.test(str)) {
        const padded = str.padStart(4, '0')
        return `${padded.slice(0, 2)}:${padded.slice(2)}`
      }
      // 8.3 or 8,3 etc -> fallback
      const onlyDigits = str.replace(/[^0-9]/g, '')
      if (onlyDigits.length >= 3 && onlyDigits.length <= 4) {
        const padded = onlyDigits.padStart(4, '0')
        return `${padded.slice(0, 2)}:${padded.slice(2)}`
      }
      return str
    }

    const decodeTipo = (t: unknown): string => {
      const v = String(t ?? '').toUpperCase()
      if (v === 'C') return 'Consulta'
      if (v === 'P') return 'Procedimiento'
      return v || ''
    }

    // Fallback: si el endpoint por proveedor no devuelve resultados, traer todas y filtrar por prestador
    let agendas: Record<string, unknown>[] = agendasFromProv
    if (!agendas || agendas.length === 0) {
      const allRes = await this.getAgendas()
      const allList: Record<string, unknown>[] = Array.isArray(allRes.data)
        ? (allRes.data as Record<string, unknown>[])
        : (Array.isArray((allRes.data as any)?.data) ? ((allRes.data as any).data as Record<string, unknown>[]) : [])
      agendas = allList.filter((a: any) => {
        const prest = String(a.codigo_prestador ?? a.codigoPrestador ?? a.prestadorId ?? a.medicoId ?? '')
        return prest === String(codigoPrestador)
      })
    }

    const detalladas: AgendaDetallada[] = agendas.map((a) => {
      const codigoConsultorio = String(
        (a as any).codigo_consultorio ?? (a as any).consultorio ?? (a as any).consultorioCodigo ?? ''
      )
      const consultorio = consultorioPorCodigo.get(codigoConsultorio)
      const buildingCode = String(consultorio?.codigo_edificio ?? '')
      const edificioRaw = buildingCode ? edificioPorCodigo.get(buildingCode) : undefined
      let edificioDescripcion = String(
        (edificioRaw as any)?.descripcion_edificio ?? (edificioRaw as any)?.descripcion ?? (edificioRaw as any)?.nombre ?? ''
      )
      if (!edificioDescripcion) {
        const rawC = consultorio?.__raw as any
        edificioDescripcion = String(
          rawC?.descripcion_edificio ?? rawC?.DES_EDIFICIO ?? rawC?.edificioNombre ?? ''
        )
      }

      const prestadorId = String(
        (a as any).codigo_prestador ?? (a as any).codigoPrestador ?? (a as any).prestadorId ?? (a as any).medicoId ?? ''
      )
      const medicoRaw = medicoPorId.get(prestadorId)
      const medicoNombre = String((medicoRaw as any)?.nombres ?? '')
      const especialidad = Array.isArray((medicoRaw as any)?.especialidades) && (medicoRaw as any).especialidades.length > 0
        ? String((medicoRaw as any).especialidades[0])
        : undefined

      const diaCodigo = String(
        (a as any).codigo_dia ?? (a as any).dia ?? (a as any).diaCodigo ?? ''
      )
      const diaNombre = decodeDiaNombre(diaCodigo)

      const horaInicio = toHHmm((a as any).hora_inicio ?? (a as any).horaInicio ?? (a as any).hora)
      const horaFin = toHHmm((a as any).hora_fin ?? (a as any).horaFin ?? (a as any).horarioFin)

      return {
        codigo_item_agendamiento: (a as any).codigo_item_agendamiento ?? (a as any).id ?? (a as any).codigo,
        codigo_prestador: (a as any).codigo_prestador,
        codigo_dia: (a as any).codigo_dia,
        hora_inicio: (a as any).hora_inicio,
        hora_fin: (a as any).hora_fin,
        tipo: (a as any).tipo,
        codigo_consultorio: (a as any).codigo_consultorio ?? codigoConsultorio,

        especialidad,
        medico: medicoNombre,
        diaNombre,
        horaInicioHHmm: horaInicio,
        horaFinHHmm: horaFin,
        consultorioDescripcion: consultorio?.descripcion_consultorio,
        consultorioCodigo: consultorio?.codigo_consultorio,
        edificioDescripcion,
        tipoTexto: decodeTipo((a as any).tipo),

        piso: consultorio?.piso,
        buildingCode
      }
    })

    return {
      data: detalladas,
      success: agendasRes.success && medicosRes.success && consultoriosRes.success && edificiosRes.success && diasRes.success,
      message: [agendasRes, medicosRes, consultoriosRes, edificiosRes, diasRes].find((r) => !r.success)?.message
    }
  }

  // ===== ENDPOINTS DE SERVICIOS EXTERNOS =====
  async getExternalDoctors(): Promise<ApiResponse<Doctor[]>> {
    return this.request<Doctor[]>('/api/external/medicos')
  }

  async getAuthStatus(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('/api/external/auth/status')
  }

  async getExternalConfig(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('/api/external/config')
  }
}

export const apiService = new ApiService()


