"use client"

import { DirectorioLayout } from "@/components/directorio-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { notFound } from "next/navigation"
import { useState, useEffect, useMemo, useRef } from "react"
import { DoorOpenIcon, BuildingIcon, CalendarCheckIcon, ClockIcon, MapPinIcon, AlertCircleIcon, UserRoundIcon as UserRoundMedical } from 'lucide-react' 
import { InteractiveMap } from "@/components/interactive-map"
import axios from "axios"
import { getAccessToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter, useParams } from "next/navigation"
import { apiService } from "@/lib/api-service"

// Normaliza textos a slug: minúsculas, sin acentos, sólo [a-z0-9-]
const slugify = (input: string): string => {
  return String(input || "")
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

export default function SchedulePage() {
  const router = useRouter()
  const { doctor: doctorSlug, specialty: specialtySlug } = useParams<{ specialty: string; doctor: string }>()
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null)
  const [doctorSchedules, setDoctorSchedules] = useState<Record<string, DoctorSchedule> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const [photoError, setPhotoError] = useState(false)

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

  // Formatea diferentes tipos de hora a formato 12h (8:00AM)
  const formatTimeTo12h = (value: unknown): string => {
    if (value == null) return ''
    const raw = String(value).trim()
    if (!raw) return ''
    // ISO date
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
      const d = new Date(raw)
      if (!isNaN(d.getTime())) {
        const h = d.getHours()
        const m = d.getMinutes()
        const period = h >= 12 ? 'PM' : 'AM'
        const hh = h % 12 === 0 ? 12 : h % 12
        return `${hh}:${m.toString().padStart(2, '0')}${period}`
      }
    }
    // HH:mm
    if (/^\d{2}:\d{2}$/.test(raw)) {
      const [hStr, mStr] = raw.split(':')
      const h = parseInt(hStr, 10)
      const m = parseInt(mStr, 10)
      const period = h >= 12 ? 'PM' : 'AM'
      const hh = h % 12 === 0 ? 12 : h % 12
      return `${hh}:${m.toString().padStart(2, '0')}${period}`
    }
    // HHmm
    if (/^\d{3,4}$/.test(raw)) {
      const padded = raw.padStart(4, '0')
      const h = parseInt(padded.slice(0, 2), 10)
      const m = parseInt(padded.slice(2), 10)
      const period = h >= 12 ? 'PM' : 'AM'
      const hh = h % 12 === 0 ? 12 : h % 12
      return `${hh}:${m.toString().padStart(2, '0')}${period}`
    }
    return raw
  }

  const formatHHmmTo12h = (raw: string): string => {
    if (!raw) return ''
    const cleaned = raw.includes(':') ? raw.replace(':', '') : raw
    if (cleaned.length < 3) return raw
    const hours24 = parseInt(cleaned.slice(0, 2), 10)
    const minutes = parseInt(cleaned.slice(2, 4) || '0', 10)
    if (isNaN(hours24) || isNaN(minutes)) return raw
    const period = hours24 >= 12 ? 'PM' : 'AM'
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
    const minutesStr = minutes.toString().padStart(2, '0')
    return `${hours12}:${minutesStr}${period}`
  }

  const isProcedure = (tipo?: string) => {
    const t = (tipo || '').toLowerCase()
    return /(proced|qx|quir|cirug)/.test(t)
  }

  const isConsulta = (tipo?: string) => !isProcedure(tipo)

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

        // 1. Resolver especialidad por ID (si el parámetro es numérico) o por slug (fallback)
        const isSpecialtyId = /^\d+$/.test(specialtySlug)
        let foundSpecialty: any
        if (isSpecialtyId) {
          const specialtyResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/especialidades/${specialtySlug}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          foundSpecialty = specialtyResponse.data
        } else {
          const specialtiesResponse = await axios.get('http://10.129.180.161:36560/api3/v1/especialidades/agenda', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const specialtiesData = specialtiesResponse.data
          foundSpecialty = specialtiesData.find((spec: any) =>
            slugify(String(spec.descripcion || '')) === slugify(String(specialtySlug))
          )
        }

        if (!foundSpecialty) throw new Error('Especialidad no encontrada')

        // 2. Resolver médico por ID (si el parámetro es numérico) o por slug (fallback)
        const isDoctorId = /^\d+$/.test(doctorSlug)
        let doctorData: any
        let doctorIdToUse: number
        if (isDoctorId) {
          const doctorDetailResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/medico/${doctorSlug}`, {
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
            slugify(String(doc.nombres || '')) === slugify(String(doctorSlug))
          )
          if (!foundDoctor) throw new Error('Médico no encontrado')
          const doctorDetailResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/medico/${foundDoctor.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          doctorData = doctorDetailResponse.data
          doctorIdToUse = foundDoctor.id
        }

        // 3. Configurar información del médico
        setDoctorInfo({
          id: doctorData.id,
          name: doctorData.nombres || 'Nombre no disponible',
          specialty: foundSpecialty.descripcion || 'Especialidad no disponible',
          specialtyId: foundSpecialty.especialidadId,
          photo: doctorData.retrato
        })

        // 4. Construir horarios con el método de orquestación
        const providerId = doctorData.codigoPrestador ?? doctorData.codigo_prestador ?? doctorIdToUse
        const detalladasRes = await apiService.getAgendasDetalladasPorMedico(String(providerId))
        const detalladas = Array.isArray(detalladasRes.data)
          ? (detalladasRes.data as any[])
          : []

        const formattedSchedules: Record<string, DoctorSchedule> = {}
        detalladas.forEach((item: any) => {
          const dayKey = normalizeDayKey(String(item.diaNombre || ''))
          if (!daysOfWeek.includes(dayKey)) return
          const rawInicio = (item.horaInicioHHmm ?? item.hora_inicio ?? item.horaInicio ?? item.hora) as unknown
          const rawFin = (item.horaFinHHmm ?? item.hora_fin ?? item.horaFin ?? item.horarioFin) as unknown
          const inicio = formatTimeTo12h(rawInicio)
          const fin = formatTimeTo12h(rawFin)
          const time = fin ? `${inicio} - ${fin}` : inicio
          formattedSchedules[dayKey] = {
            time,
            room: item.consultorioDescripcion || 'Consultorio no asignado',
            building: item.edificioDescripcion || 'Edificio Principal',
            floor: item.piso || (item as any).pisoDescripcion || (item as any).des_piso || undefined,
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
  }, [doctorSlug, specialtySlug])

  const availableDays = useMemo(() => {
    return Object.keys(doctorSchedules || {}).filter((d) => daysOfWeek.includes(d))
  }, [doctorSchedules])

  const consultaDays = useMemo(() => {
    return daysOfWeek.filter((day) => {
      const s = (doctorSchedules || {})[day]
      if (!s) return false
      return isConsulta(s.tipo)
    })
  }, [doctorSchedules])

  const procedimientoDays = useMemo(() => {
    return daysOfWeek.filter((day) => {
      const s = (doctorSchedules || {})[day]
      if (!s) return false
      return isProcedure(s.tipo)
    })
  }, [doctorSchedules])

  useEffect(() => {
    if (selectedDay && !availableDays.includes(selectedDay)) {
      setSelectedDay(null)
    }
  }, [selectedDay, availableDays])

  useEffect(() => {
    if (selectedDay && doctorSchedules?.[selectedDay]) {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedDay, doctorSchedules])

  if (loading) {
    return (
      <DirectorioLayout>
        <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F9F4F6' }}>
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
            <div className="flex items-center space-x-4 w-full max-w-3xl">
              <Skeleton className="h-24 w-24 rounded-full bg-[#E5E5E5]" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-3/4 bg-[#E5E5E5]" />
                <Skeleton className="h-6 w-1/2 bg-[#E5E5E5]" />
              </div>
            </div>
            
            <div className="w-full max-w-4xl space-y-4">
              <Skeleton className="h-8 w-64 mx-auto bg-[#E5E5E5]" />
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg bg-[#E5E5E5]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DirectorioLayout>
    )
  }

  if (error) {
    return (
      <DirectorioLayout>
        <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F9F4F6' }}>
          <div className="max-w-2xl mx-auto bg-[#F9F4F6] border border-[#7F0C43] rounded-lg p-6 text-center">
            <AlertCircleIcon className="mx-auto h-12 w-12 text-[#7F0C43] mb-4" />
            <h2 className="text-2xl font-bold text-[#7F0C43] mb-2" style={{ fontFamily: "'Century Gothic', sans-serif" }}>Error al cargar los datos</h2>
            <p className="text-[#7F0C43] mb-6" style={{ fontFamily: "Arial, sans-serif" }}>{error}</p>
            <div className="flex justify-center gap-4">
              <Button 
                variant="destructive"
                onClick={() => window.location.reload()}
                className="bg-[#7F0C43] hover:bg-[#C84D80] text-white"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                Reintentar
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.back()}
                className="border-[#7F0C43] text-[#7F0C43] hover:bg-[#F9F4F6]"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                Volver atrás
              </Button>
            </div>
          </div>
        </div>
      </DirectorioLayout>
    )
  }

  if (!doctorInfo || !doctorSchedules) {
    notFound()
  }

  return (
    <DirectorioLayout>
      <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F9F4F6' }}>
        {/* Doctor Profile Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white rounded-xl shadow-sm p-6 border border-[#E5E5E5]">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#F9F4F6] overflow-hidden flex items-center justify-center">
            {doctorInfo.photo && !photoError ? (
              <img 
                src={doctorInfo.photo} 
                alt={`Foto del Dr. ${doctorInfo.name}`} 
                className="w-full h-full object-cover"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <UserRoundMedical className="w-16 h-16 md:w-20 md:h-20 text-[#7F0C43]" />
            )}
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#333333] mb-1" style={{ fontFamily: "'Century Gothic', sans-serif" }}>Dr. {doctorInfo.name}</h1>
            <p className="text-lg text-[#7F0C43] font-medium mb-3" style={{ fontFamily: "'Century Gothic', sans-serif" }}>{doctorInfo.specialty}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {availableDays.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F9F4F6] text-[#7F0C43] text-sm font-medium border border-[#C84D80]" style={{ fontFamily: "Arial, sans-serif" }}>
                  <CalendarCheckIcon className="h-4 w-4 mr-1" />
                  {availableDays.length} día{availableDays.length !== 1 ? 's' : ''} disponible{availableDays.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <section className="mb-12">
          <h1 className="doctor-schedule-title">Horarios de atención de {doctorInfo.name}</h1>

          {consultaDays.length > 0 && (
            <>
              <h3 className="doctor-schedule-section-title text-2xl font-bold text-[#7F0C43] mb-4 text-center" style={{ fontFamily: "'Century Gothic', sans-serif" }}>Consultas</h3>
              <div className="doctor-schedule-days-grid inline-grid mx-auto grid grid-cols-3 gap-4 justify-items-center">
                {consultaDays.map((day) => {
                  const isSelected = selectedDay === day
                  return (
                <Card
                  key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`doctor-schedule-day-card${isSelected ? ' selected' : ''} flex items-center justify-center h-32 w-40 text-center`}
                    >
                      <CardTitle className="doctor-schedule-day-title">{dayNames[day]}</CardTitle>
                      <CalendarCheckIcon className="doctor-schedule-day-icon" />
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {procedimientoDays.length > 0 && (
            <>
              <h3 className="doctor-schedule-section-title text-2xl font-bold text-[#7F0C43] mb-4 text-center" style={{ fontFamily: "'Century Gothic', sans-serif" }}>Procedimientos</h3>
              <div className="doctor-schedule-days-grid inline-grid mx-auto grid grid-cols-3 gap-4 justify-items-center">
                {procedimientoDays.map((day) => {
                  const isSelected = selectedDay === day
                  return (
                    <Card
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`doctor-schedule-day-card${isSelected ? ' selected' : ''} flex items-center justify-center h-32 w-40 text-center`}
                    >
                      <CardTitle className="doctor-schedule-day-title">{dayNames[day]}</CardTitle>
                      <CalendarCheckIcon className="doctor-schedule-day-icon" />
                </Card>
                  )
                })}
            </div>
            </>
          )}
        </section>

        {/* Selected Day Details */}
        <div ref={detailsRef} />
        {selectedDay && doctorSchedules?.[selectedDay] && (
          <>
            <Card className="doctor-schedule-details-card w-full">
              <CardHeader className="doctor-schedule-details-header">
                <CardTitle className="doctor-schedule-details-title">
                    Detalles para {dayNames[selectedDay]}
                  </CardTitle>
                </CardHeader>
              <CardContent className="doctor-schedule-details-content">
                <p className="doctor-schedule-details-row">
                  <CalendarCheckIcon className="doctor-schedule-details-icon" />
                  <span className="doctor-schedule-details-label">Horario:</span>{' '}
                  {doctorSchedules[selectedDay].time}
                </p>
                <p className="doctor-schedule-details-row flex items-center gap-2 mb-3">
                  <DoorOpenIcon className="doctor-schedule-details-icon h-5 w-5 text-[#7F0C43]" />
                  <span className="doctor-schedule-details-label font-medium">Consultorio:</span>
                  <span>{doctorSchedules[selectedDay].room}</span>
                </p>
                <p className="doctor-schedule-details-row flex items-center gap-2 mb-3">
                  <BuildingIcon className="doctor-schedule-details-icon h-5 w-5 text-[#7F0C43]" />
                  <span className="doctor-schedule-details-label font-medium">Edificio:</span>
                  <span>{doctorSchedules[selectedDay].building}</span>
                </p>
                <p className="doctor-schedule-details-row flex items-center gap-2">
                  <MapPinIcon className="doctor-schedule-details-icon h-5 w-5 text-[#7F0C43]" />
                  <span className="doctor-schedule-details-label font-medium">Piso:</span>
                  <span>{doctorSchedules[selectedDay].floor || 'No especificado'}</span>
                </p>
                </CardContent>
              </Card>

                  <InteractiveMap
                    consultorio={doctorSchedules[selectedDay].room}
                    building={doctorSchedules[selectedDay].building}
                    floor={doctorSchedules[selectedDay].floor}
                  />
          </>
        )}

        {selectedDay && !doctorSchedules?.[selectedDay] && (
          <Card className="doctor-schedule-empty-card">
            <CardTitle className="doctor-schedule-empty-title">¡Atención!</CardTitle>
            <p className="doctor-schedule-empty-text">
              El Dr. {doctorInfo.name} no tiene horario disponible para el <b>{dayNames[selectedDay]}</b>.
            </p>
            <p className="doctor-schedule-empty-subtext">
              Por favor, selecciona otro día o regresa a la lista de doctores.
            </p>
          </Card>
        )}
      </div>
    </DirectorioLayout>
  )
}