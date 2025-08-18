"use client"

import { DirectorioLayout } from "@/components/directorio-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { notFound } from "next/navigation"
import { useState, useEffect } from "react"
import { DoorOpenIcon, BuildingIcon, CalendarCheckIcon } from 'lucide-react' 
import { InteractiveMap } from "@/components/interactive-map"
import axios from "axios"
import { getAccessToken } from "../../../api/auth/auth"
import { apiService } from "@/lib/api-service"

interface DoctorSchedule {
  time: string
  room: string
  building: string
  floor?: string
}

interface DoctorInfo {
  id: number
  name: string
  specialty: string
  specialtyId: number
  photo?: string
}

interface SchedulePageProps {
  params: {
    specialty: string
    doctor: string
  }
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const { doctor: doctorParam, specialty: specialtyParam } = params
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null)
  const [doctorSchedules, setDoctorSchedules] = useState<Record<string, DoctorSchedule> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const dayNames: { [key: string]: string } = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = await getAccessToken()

        const fetchJson = async (url: string) => {
          const res = await fetch(url, { cache: 'no-store' })
          if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(`HTTP ${res.status} ${res.statusText} al pedir ${url}. Respuesta: ${text.slice(0, 120)}`)
          }
          const contentType = res.headers.get('content-type') || ''
          const text = await res.text()
          if (!contentType.includes('application/json')) {
            throw new Error(`Respuesta no JSON desde ${url}: ${text.slice(0, 120)}`)
          }
          try {
            return JSON.parse(text)
          } catch (e) {
            throw new Error(`JSON inválido desde ${url}: ${(e as Error).message}`)
          }
        }

        // 1. Resolver especialidad por ID (si el parámetro es numérico) o por slug (fallback)
        const isSpecialtyId = /^\d+$/.test(specialtyParam)
        let foundSpecialty: any
        if (isSpecialtyId) {
          const specialtyResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/especialidades/${specialtyParam}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          foundSpecialty = specialtyResponse.data
        } else {
          const specialtiesResponse = await axios.get('http://10.129.180.161:36560/api3/v1/especialidades/agenda', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const specialtiesData = specialtiesResponse.data
          foundSpecialty = specialtiesData.find((spec: any) =>
            spec.descripcion?.toLowerCase().replace(/\s+/g, '-') === specialtyParam
          )
        }

        if (!foundSpecialty) throw new Error('Especialidad no encontrada')

        // 2. Resolver médico por ID (si el parámetro es numérico) o por slug (fallback)
        const isDoctorId = /^\d+$/.test(doctorParam)
        let doctorData: any
        let doctorIdToUse: number
        if (isDoctorId) {
          const doctorDetailResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/medico/${doctorParam}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          doctorData = doctorDetailResponse.data
          doctorIdToUse = doctorData.id
        } else {
          const doctorsResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/medico/especialidad/${foundSpecialty.especialidadId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const doctorsData = doctorsResponse.data
          const foundDoctor = doctorsData.find((doc: any) =>
            doc.nombres?.toLowerCase().replace(/\s+/g, '-') === doctorParam
          )
          if (!foundDoctor) throw new Error('Médico no encontrado')
          const doctorDetailResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/medico/${foundDoctor.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          doctorData = doctorDetailResponse.data
          doctorIdToUse = foundDoctor.id
        }

        // 4. Configurar información del médico
        setDoctorInfo({
          id: doctorData.id,
          name: doctorData.nombres || 'Nombre no disponible',
          specialty: foundSpecialty.descripcion || 'Especialidad no disponible',
          specialtyId: foundSpecialty.especialidadId,
          photo: doctorData.retrato
        })

        // 3. Construir horarios desde endpoints de agendas y catálogos
        const providerId = doctorData.codigoPrestador ?? doctorData.codigo_prestador ?? doctorIdToUse

        // Agendas desde backend real
        let agendasData: any[] = []
        const byProv = await apiService.getAgendasByProvider(String(providerId))
        if (byProv.success && Array.isArray(byProv.data)) {
          agendasData = byProv.data as any[]
        } else {
          const all = await apiService.getAgendas()
          const list = all.success && Array.isArray(all.data) ? (all.data as any[]) : []
          agendasData = list.filter((a: any) => {
            const prestador = a.prestadorId ?? a.medicoId ?? a.codigoPrestador ?? a.codigo_prestador
            return String(prestador ?? '') === String(providerId)
          })
        }

        // Catálogos desde backend real
        const [consRes, diasRes] = await Promise.all([
          apiService.getConsultorios(),
          apiService.getDays()
        ])
        const consultorios = Array.isArray(consRes.data) ? (consRes.data as any[]) : []
        const diasCatalog = Array.isArray(diasRes.data) ? (diasRes.data as any[]) : []

        const consultorioPorCodigo: Record<string, any> = {}
        consultorios.forEach((c: any) => {
          const code = String(c.codigo ?? c.id ?? '')
          if (code) consultorioPorCodigo[code] = c
        })

        const diaNombrePorCodigo: Record<string, string> = {}
        diasCatalog.forEach((d: any) => {
          const code = String(d.codigo ?? d.id ?? '')
          const name = String(d.nombre ?? d.descripcion ?? d.name ?? '')
          if (code) diaNombrePorCodigo[code] = name
        })

        const formattedSchedules: Record<string, DoctorSchedule> = {}
        agendasData.forEach((a: any) => {
          const diaCode = String(a.dia ?? a.diaCodigo ?? a.dia_id ?? '')
          const diaNombre = diaNombrePorCodigo[diaCode]
          if (!diaNombre) return

          const consultorioCode = String(a.consultorio ?? a.consultorioCodigo ?? a.consultorio_id ?? '')
          const cons = consultorioPorCodigo[consultorioCode]

          const time = a.hora ?? a.horario ?? a.horaInicio ?? ''
          const dayKey = diaNombre.toLowerCase()
          if (!daysOfWeek.includes(dayKey)) return

          formattedSchedules[dayKey] = {
            time: String(time),
            room: (cons?.nombre ?? cons?.descripcion ?? consultorioCode) || 'Consultorio no asignado',
            building: cons?.edificio ?? 'Edificio Principal',
            floor: cons?.piso ?? undefined,
          }
        })

        setDoctorSchedules(formattedSchedules)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setLoading(false)
      }
    }

    fetchData()
  }, [doctorParam, specialtyParam])

  if (loading) {
    return (
      <DirectorioLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando información del médico...</p>
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
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </DirectorioLayout>
    )
  }

  if (!doctorInfo || !doctorSchedules) {
    notFound()
  }

  return (
    <DirectorioLayout>
      <div className="doctor-profile-container">
        {doctorInfo.photo && (
          <div className="doctor-photo-container">
            <img 
              src={doctorInfo.photo} 
              alt={`Foto del Dr. ${doctorInfo.name}`} 
              className="doctor-photo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        <div className="doctor-info">
          <h1 className="doctor-name">Dr. {doctorInfo.name}</h1>
          <p className="doctor-specialty">{doctorInfo.specialty}</p>
        </div>
      </div>

      <div className="schedule-section">
        <h2 className="section-title">Horarios de Consulta</h2>
        
        <div className="days-grid">
          {daysOfWeek.map((day) => (
            <Card
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`day-card ${selectedDay === day ? 'selected' : ''} ${
                !doctorSchedules[day] ? 'unavailable' : 'available'
              }`}
            >
              <CardTitle className="day-title">{dayNames[day]}</CardTitle>
              {doctorSchedules[day] ? (
                <>
                  <CalendarCheckIcon className="day-icon" />
                  <p className="day-time">{doctorSchedules[day].time}</p>
                </>
              ) : (
                <p className="day-unavailable">No disponible</p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {selectedDay && doctorSchedules[selectedDay] && (
        <div className="schedule-details-section">
          <Card className="details-card">
            <CardHeader>
              <CardTitle className="details-title">
                Detalles para {dayNames[selectedDay]}
              </CardTitle>
            </CardHeader>
            <CardContent className="details-content">
              <div className="detail-row">
                <CalendarCheckIcon className="detail-icon" />
                <div>
                  <span className="detail-label">Horario:</span>
                  <span className="detail-value">{doctorSchedules[selectedDay].time}</span>
                </div>
              </div>
              
              <div className="detail-row">
                <DoorOpenIcon className="detail-icon" />
                <div>
                  <span className="detail-label">Consultorio:</span>
                  <span className="detail-value">{doctorSchedules[selectedDay].room}</span>
                </div>
              </div>
              
              <div className="detail-row">
                <BuildingIcon className="detail-icon" />
                <div>
                  <span className="detail-label">Edificio:</span>
                  <span className="detail-value">{doctorSchedules[selectedDay].building}</span>
                </div>
              </div>
              
              {doctorSchedules[selectedDay].floor && (
                <div className="detail-row">
                  <BuildingIcon className="detail-icon" />
                  <div>
                    <span className="detail-label">Piso:</span>
                    <span className="detail-value">{doctorSchedules[selectedDay].floor}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <InteractiveMap
            consultorio={doctorSchedules[selectedDay].room}
            building={doctorSchedules[selectedDay].building}
            floor={doctorSchedules[selectedDay].floor}
          />
        </div>
      )}

      {selectedDay && !doctorSchedules[selectedDay] && (
        <Card className="no-schedule-card">
          <CardHeader>
            <CardTitle className="no-schedule-title">¡Atención!</CardTitle>
          </CardHeader>
          <CardContent className="no-schedule-content">
            <p>El Dr. {doctorInfo.name} no tiene horario disponible para el <b>{dayNames[selectedDay]}</b>.</p>
            <p>Por favor, selecciona otro día o regresa a la lista de doctores.</p>
          </CardContent>
        </Card>
      )}
    </DirectorioLayout>
  )
}