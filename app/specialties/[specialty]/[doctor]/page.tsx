"use client"

import React from "react"
import { DirectorioLayout } from "@/components/directorio-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { notFound } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
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
  tipo?: string
}

interface DoctorInfo {
  id: number
  name: string
  specialty: string
  specialtyId: number
  photo?: string
}

interface SchedulePageProps {
  params: Promise<{
    specialty: string
    doctor: string
  }>
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const { doctor: doctorParam, specialty: specialtyParam } = React.use(params)
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

  const normalizeDayKey = (nameOrKey: string) => {
    const key = (nameOrKey || '').toLowerCase()
    const map: Record<string, string> = {
      lunes: 'monday',
      martes: 'tuesday',
      miércoles: 'wednesday',
      miercoles: 'wednesday',
      jueves: 'thursday',
      viernes: 'friday',
      sábado: 'saturday',
      sabado: 'saturday',
      domingo: 'sunday',
    }
    return map[key] || key
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

        // 3. Construir horarios con el método de orquestación (según reglas solicitadas)
        const providerId = doctorData.codigoPrestador ?? doctorData.codigo_prestador ?? doctorIdToUse
        const detalladasRes = await apiService.getAgendasDetalladasPorMedico(String(providerId))
        const detalladas = Array.isArray(detalladasRes.data)
          ? (detalladasRes.data as any[])
          : []

        const formattedSchedules: Record<string, DoctorSchedule> = {}
        detalladas.forEach((item: any) => {
          const dayKey = normalizeDayKey(String(item.diaNombre || ''))
          if (!daysOfWeek.includes(dayKey)) return
          const inicio = String(item.horaInicioHHmm || '')
          const fin = String(item.horaFinHHmm || '')
          const time = fin ? `${inicio} - ${fin}` : inicio
          formattedSchedules[dayKey] = {
            time,
            room: item.consultorioDescripcion ? `${item.consultorioDescripcion}${item.consultorioCodigo ? ` (${item.consultorioCodigo})` : ''}` : (item.consultorioCodigo || 'Consultorio no asignado'),
            building: item.edificioDescripcion || 'Edificio Principal',
            floor: item.piso ?? undefined,
            tipo: item.tipoTexto || undefined,
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

  const availableDays = useMemo(() => {
    return Object.keys(doctorSchedules || {}).filter((d) => daysOfWeek.includes(d))
  }, [doctorSchedules])

  useEffect(() => {
    if (selectedDay && !availableDays.includes(selectedDay)) {
      setSelectedDay(null)
    }
  }, [selectedDay, availableDays])

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

        {availableDays.length === 0 && (
          <p>No hay días disponibles para este médico.</p>
        )}

        <div className="days-grid">
          {availableDays.map((day) => (
            <Card
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`day-card ${selectedDay === day ? 'selected' : ''} available`}
            >
              <CardTitle className="day-title">{dayNames[day]}</CardTitle>
              <>
                <CalendarCheckIcon className="day-icon" />
                <p className="day-time">{doctorSchedules[day].time}</p>
                {doctorSchedules[day].tipo && (
                  <p className="day-type">Tipo: {doctorSchedules[day].tipo}</p>
                )}
              </>
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

              {doctorSchedules[selectedDay].tipo && (
                <div className="detail-row">
                  <CalendarCheckIcon className="detail-icon" />
                  <div>
                    <span className="detail-label">Tipo:</span>
                    <span className="detail-value">{doctorSchedules[selectedDay].tipo}</span>
                  </div>
                </div>
              )}
              
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