"use client"

import { useEffect, useMemo, useState } from "react"
import { DirectorioLayout } from "@/components/directorio-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiService } from "@/lib/api-service"

type JsonRecord = Record<string, any>

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

  // Carga inicial de catálogos y agendas
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const [agRes, consRes, diasRes, edifRes] = await Promise.all([
          fetch(`/api/agnd-agenda`, { cache: "no-store" }),
          fetch(`/api/catalogos/consultorios`, { cache: "no-store" }),
          fetch(`/api/catalogos/dias`, { cache: "no-store" }),
          fetch(`/api/catalogos/edificios`, { cache: "no-store" }),
        ])

        if (!agRes.ok || !consRes.ok || !diasRes.ok || !edifRes.ok) {
          throw new Error("Error al cargar datos de agendas o catálogos")
        }

        const [agData, consData, diasData, edifData] = await Promise.all([
          agRes.json(),
          consRes.json(),
          diasRes.json(),
          edifRes.json(),
        ])

        if (cancelled) return
        const rawAgendas: JsonRecord[] = Array.isArray(agData)
          ? agData as JsonRecord[]
          : (Array.isArray((agData as any)?.data) ? (agData as any).data as JsonRecord[] : [])
        // Normalizar campos desde AGND_AGENDA
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
        setConsultorios(Array.isArray(consData?.data) ? consData.data : consData)
        setDias(Array.isArray(diasData?.data) ? diasData.data : diasData)
        setEdificios(Array.isArray(edifData?.data) ? edifData.data : edifData)
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

  // Cuando se elige un edificio, cargar sus pisos desde el endpoint dedicado
  useEffect(() => {
    let cancelled = false
    const loadFloors = async () => {
      try {
        if (!edificioSeleccionado) {
          setPisos([])
          setPisoSeleccionado("")
          return
        }
        const res = await fetch(`/api/catalogos/edificios/${edificioSeleccionado}/pisos`, { cache: "no-store" })
        if (!res.ok) throw new Error("Error al cargar pisos del edificio")
        const data = await res.json()
        if (!cancelled) {
          const pisosList = Array.isArray(data?.data) ? data.data : data
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

  const consultorioPorCodigo: Record<string, JsonRecord> = useMemo(() => {
    const map: Record<string, JsonRecord> = {}
    consultorios.forEach((c) => {
      const codigo = String(c.codigo ?? c.id ?? "")
      if (codigo) map[codigo] = c
    })
    return map
  }, [consultorios])

  const nombreDiaPorCodigo: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {}
    dias.forEach((d) => {
      const codigo = String(d.codigo ?? d.id ?? "")
      const nombre = String(d.nombre ?? d.descripcion ?? d.name ?? "")
      if (codigo) map[codigo] = nombre
    })
    return map
  }, [dias])

  const agendasFiltradas = useMemo(() => {
    // Enriquecer agendas con datos de consultorio, edificio, piso y día
    const enriquecidas: JsonRecord[] = agendas.map((a: JsonRecord) => {
      const codigoConsultorio = String(a.consultorio ?? a.consultorioCodigo ?? a.consultorio_id ?? a.codigo_consultorio ?? "")
      const c = consultorioPorCodigo[codigoConsultorio]
      return {
        ...a,
        consultorioCodigo: codigoConsultorio,
        consultorioNombre: c?.nombre ?? c?.descripcion ?? "",
        edificio: c?.edificio ?? "",
        piso: c?.piso ?? "",
        diaNombre: nombreDiaPorCodigo[String(a.dia ?? a.diaCodigo ?? a.dia_id ?? a.codigo_dia ?? "")] ?? "",
      }
    })

    return enriquecidas.filter((a) => {
      if (edificioSeleccionado && String(a.edificio) !== String(edificioSeleccionado)) return false
      if (pisoSeleccionado && String(a.piso) !== String(pisoSeleccionado)) return false
      return true
    })
  }, [agendas, consultorioPorCodigo, nombreDiaPorCodigo, edificioSeleccionado, pisoSeleccionado])

  if (loading) {
    return (
      <DirectorioLayout>
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Cargando agendas...</p>
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
                    <SelectItem key={String(e.codigo ?? e.id)} value={String(e.codigo ?? e.id)}>
                      {String(e.nombre ?? e.descripcion ?? e.name ?? e.codigo ?? e.id)}
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
                    <SelectItem key={String(p.codigo ?? p.id)} value={String(p.codigo ?? p.id)}>
                      {String(p.nombre ?? p.descripcion ?? p.name ?? p.codigo ?? p.id)}
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
                    <TableCell>{a.hora ?? a.horario ?? a.horaInicio ?? ""}</TableCell>
                    <TableCell>{a.tipo ?? ''}</TableCell>
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


