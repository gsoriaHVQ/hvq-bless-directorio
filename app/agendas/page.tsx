"use client"

import { useEffect, useMemo, useState } from "react"
import { DirectorioLayout } from "@/components/directorio-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiService } from "@/lib/api-service"
import { Spinner } from "@/components/ui/spinner"

type JsonRecord = Record<string, any>

interface AgendaEnriquecida {
  id: string | number
  dia: string
  diaNombre: string
  consultorio: string
  consultorioCodigo: string
  consultorioNombre: string
  edificio: string
  piso: string
  hora: string
  horaInicio: string
  horaFin: string
  tipo: string
}

export default function AgendasPage() {
  const [agendas, setAgendas] = useState<JsonRecord[]>([])
  const [consultorios, setConsultorios] = useState<JsonRecord[]>([])
  const [dias, setDias] = useState<JsonRecord[]>([])
  const [edificios, setEdificios] = useState<JsonRecord[]>([])
  const [pisos, setPisos] = useState<JsonRecord[]>([])

  const [edificioSeleccionado, setEdificioSeleccionado] = useState<string>("")
  const [pisoSeleccionado, setPisoSeleccionado] = useState<string>("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carga inicial de catálogos y agendas usando el servicio de API
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        
        // Usar el servicio de API que se conecta al backend real
        const [agRes, consRes, diasRes, edifRes] = await Promise.all([
          apiService.getAgendas(),
          apiService.getConsultorios(),
          apiService.getDias(),
          apiService.getEdificios(),
        ])

        if (!agRes.success || !consRes.success || !diasRes.success || !edifRes.success) {
          throw new Error("Error al cargar datos de agendas o catálogos")
        }

        if (cancelled) return

        // Normalizar datos de agendas
        const rawAgendas: JsonRecord[] = Array.isArray(agRes.data)
          ? agRes.data as JsonRecord[]
          : (Array.isArray((agRes.data as any)?.data) ? (agRes.data as any).data as JsonRecord[] : [])

        const normalizedAgendas = (rawAgendas || []).map((a: JsonRecord) => {
          const codigoConsultorio = a.consultorio ?? a.consultorioCodigo ?? a.consultorio_id ?? a.codigo_consultorio
          const diaCodigo = a.dia ?? a.diaCodigo ?? a.dia_id ?? a.codigo_dia
          const horaInicio = a.hora ?? a.horario ?? a.horaInicio ?? a.hora_inicio
          const horaFin = a.horaFin ?? a.horarioFin ?? a.hora_fin
          const tipo = a.tipo ?? a.type
          
          return {
            ...a,
            id: a.id ?? a.codigo_agenda ?? a.codigo ?? undefined,
            consultorio: codigoConsultorio,
            consultorioCodigo: String(codigoConsultorio ?? ''),
            dia: diaCodigo,
            diaCodigo: String(diaCodigo ?? ''),
            hora: horaInicio,
            horaInicio: horaInicio,
            horaFin: horaFin,
            tipo
          }
        })

        setAgendas(normalizedAgendas)
        setConsultorios(Array.isArray(consRes.data) ? consRes.data as JsonRecord[] : [])
        setDias(Array.isArray(diasRes.data) ? diasRes.data as JsonRecord[] : [])
        setEdificios(Array.isArray(edifRes.data) ? edifRes.data as JsonRecord[] : [])
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Cuando se elige un edificio, cargar sus pisos
  useEffect(() => {
    let cancelled = false
    const loadFloors = async () => {
      try {
        if (!edificioSeleccionado) {
          setPisos([])
          setPisoSeleccionado("")
          return
        }
        
        const res = await apiService.getPisosEdificio(edificioSeleccionado)
        if (!res.success) throw new Error("Error al cargar pisos del edificio")
        
        if (!cancelled) {
          const pisosList = Array.isArray(res.data) ? (res.data as unknown as JsonRecord[]) : []
          setPisos(pisosList)
          setPisoSeleccionado("")
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error cargando pisos")
      }
    }
    loadFloors()
    return () => {
      cancelled = true
    }
  }, [edificioSeleccionado])

  // Mapear consultorios por código para acceso rápido
  const consultorioPorCodigo: Record<string, JsonRecord> = useMemo(() => {
    const map: Record<string, JsonRecord> = {}
    consultorios.forEach((c) => {
      const codigo = String(c.codigo ?? c.id ?? c.codigo_consultorio ?? c.CD_CONSULTORIO ?? "")
      if (codigo) map[codigo] = c
    })
    return map
  }, [consultorios])

  // Mapear edificios por código para acceso rápido
  const edificioPorCodigo: Record<string, JsonRecord> = useMemo(() => {
    const map: Record<string, JsonRecord> = {}
    edificios.forEach((e) => {
      const codigo = String(e.codigo ?? e.id ?? e.codigo_edificio ?? e.CD_EDIFICIO ?? "")
      if (codigo) map[codigo] = e
    })
    return map
  }, [edificios])

  // Mapear días por código
  const nombreDiaPorCodigo: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {}
    dias.forEach((d) => {
      const codigo = String(d.codigo ?? d.id ?? "")
      const nombre = String(d.nombre ?? d.descripcion ?? d.name ?? "")
      if (codigo) map[codigo] = nombre
    })
    return map
  }, [dias])

  // Enriquecer agendas con información completa de ubicación
  const agendasFiltradas = useMemo(() => {
    const enriquecidas: AgendaEnriquecida[] = agendas.map((a: JsonRecord) => {
      const codigoConsultorio = String(a.consultorio ?? a.consultorioCodigo ?? a.consultorio_id ?? a.codigo_consultorio ?? "")
      
      // 1. Obtener información del consultorio
      const consultorio = consultorioPorCodigo[codigoConsultorio]
      
      // 2. Obtener código del edificio desde el consultorio
      const codigoEdificio = String(consultorio?.codigo_edificio ?? consultorio?.CD_EDIFICIO ?? consultorio?.edificio ?? "")
      
      // 3. Obtener información del edificio
      const edificio = edificioPorCodigo[codigoEdificio]
      
      // 4. Obtener información del piso desde el consultorio
      const codigoPiso = consultorio?.piso ?? consultorio?.CD_PISO ?? consultorio?.codigo_piso
      
      // 5. Construir objeto enriquecido
      return {
        id: a.id ?? a.codigo_agenda ?? a.codigo ?? `agenda-${Math.random()}`,
        dia: String(a.dia ?? a.diaCodigo ?? a.dia_id ?? a.codigo_dia ?? ""),
        diaNombre: nombreDiaPorCodigo[String(a.dia ?? a.diaCodigo ?? a.dia_id ?? a.codigo_dia ?? "")] ?? "",
        consultorio: codigoConsultorio,
        consultorioCodigo: codigoConsultorio,
        consultorioNombre: String(consultorio?.nombre ?? consultorio?.descripcion ?? consultorio?.DES_CONSULTORIO ?? consultorio?.des_consultorio ?? codigoConsultorio),
        edificio: String(edificio?.nombre ?? edificio?.descripcion ?? edificio?.DES_EDIFICIO ?? edificio?.des_edificio ?? edificio?.descripcion_edificio ?? "Hospital Principal"),
        piso: codigoPiso ? `Piso ${codigoPiso}` : "Piso 1",
        hora: String(a.hora ?? a.horario ?? a.horaInicio ?? a.hora_inicio ?? ""),
        horaInicio: String(a.hora ?? a.horario ?? a.horaInicio ?? a.hora_inicio ?? ""),
        horaFin: String(a.horaFin ?? a.horarioFin ?? a.hora_fin ?? ""),
        tipo: String(a.tipo ?? "")
      }
    })

    // Aplicar filtros
    return enriquecidas.filter((a) => {
      if (edificioSeleccionado && a.edificio !== edificioSeleccionado) return false
      if (pisoSeleccionado && a.piso !== pisoSeleccionado) return false
      return true
    })
  }, [agendas, consultorioPorCodigo, edificioPorCodigo, nombreDiaPorCodigo, edificioSeleccionado, pisoSeleccionado])

  if (loading) {
    return (
      <DirectorioLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner size="lg" />
        </div>
      </DirectorioLayout>
    )
  }

  if (error) {
    return (
      <DirectorioLayout>
        <div className="error-container">
          <h2>Error al cargar los datos</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </DirectorioLayout>
    )
  }

  return (
    <DirectorioLayout>
      <Card className="w-full max-w-5xl">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium">Edificio</label>
              <Select value={edificioSeleccionado} onValueChange={setEdificioSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los edificios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {edificios.map((e) => (
                    <SelectItem key={String(e.codigo ?? e.id)} value={String(e.nombre ?? e.descripcion ?? e.DES_EDIFICIO ?? e.des_edificio ?? e.codigo ?? e.id)}>
                      {String(e.nombre ?? e.descripcion ?? e.DES_EDIFICIO ?? e.des_edificio ?? e.codigo ?? e.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Piso</label>
              <Select value={pisoSeleccionado} onValueChange={setPisoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los pisos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {pisos.map((p) => (
                    <SelectItem key={String(p.codigo ?? p.id)} value={String(p.nombre ?? p.descripcion ?? p.DES_PISO ?? p.des_piso ?? p.codigo ?? p.id)}>
                      {String(p.nombre ?? p.descripcion ?? p.DES_PISO ?? p.des_piso ?? p.codigo ?? p.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Consultorio</TableHead>
                  <TableHead>Edificio</TableHead>
                  <TableHead>Piso</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendasFiltradas.map((a, idx) => (
                  <TableRow key={a.id ?? idx}>
                    <TableCell>{a.diaNombre || a.dia || ""}</TableCell>
                    <TableCell>{a.consultorioNombre || a.consultorioCodigo}</TableCell>
                    <TableCell>{a.edificio}</TableCell>
                    <TableCell>{a.piso}</TableCell>
                    <TableCell>{a.hora || ""}</TableCell>
                    <TableCell>{a.tipo || ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DirectorioLayout>
  )
}


