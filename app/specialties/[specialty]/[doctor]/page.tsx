"use client"

import { DirectorioLayout } from "@/components/directorio-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { notFound } from "next/navigation"
import { useState, useEffect, useMemo, useRef } from "react"
import { DoorOpenIcon, BuildingIcon, CalendarCheckIcon, ClockIcon, MapPinIcon, AlertCircleIcon, UserRoundIcon as UserRoundMedical, ClipboardListIcon, ScissorsIcon } from 'lucide-react' 
import { InteractiveMap } from "@/components/interactive-map"
import axios from "axios"
import { getAccessToken } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter, useParams } from "next/navigation"
import { apiService } from "@/lib/api-service"
import { extractHHmm, formatHHmmTo12h } from "@/lib/utils"

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
  const [doctorSchedules, setDoctorSchedules] = useState<Record<string, DoctorSchedule[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedKind, setSelectedKind] = useState<'consulta' | 'procedimiento' | null>(null)
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

        const formattedSchedules: Record<string, DoctorSchedule[]> = {}
        detalladas.forEach((item: any) => {
          const dayKey = normalizeDayKey(String(item.diaNombre || ''))
          if (!daysOfWeek.includes(dayKey)) return
          const rawInicio = (item.horaInicioHHmm ?? item.hora_inicio ?? item.horaInicio ?? item.hora) as unknown
          const rawFin = (item.horaFinHHmm ?? item.hora_fin ?? item.horaFin ?? item.horarioFin) as unknown
          const inicio = formatHHmmTo12h(extractHHmm(rawInicio))
          const fin = formatHHmmTo12h(extractHHmm(rawFin))
          const time = fin ? `${inicio} - ${fin}` : inicio
          const entry: DoctorSchedule = {
            time,
            room: item.consultorioDescripcion || 'Consultorio no asignado',
            building: item.edificioDescripcion || 'Edificio Principal',
            floor: item.piso || (item as any).pisoDescripcion || (item as any).des_piso || undefined,
            tipo: item.tipoTexto || undefined,
          }
          if (!formattedSchedules[dayKey]) formattedSchedules[dayKey] = []
          formattedSchedules[dayKey].push(entry)
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
      const list = (doctorSchedules || {})[day]
      if (!list || list.length === 0) return false
      return list.some((s) => isConsulta(s.tipo))
    })
  }, [doctorSchedules])

  const procedimientoDays = useMemo(() => {
    return daysOfWeek.filter((day) => {
      const list = (doctorSchedules || {})[day]
      if (!list || list.length === 0) return false
      return list.some((s) => isProcedure(s.tipo))
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
        <section className="mb-12 flex flex-col items-center">
          <h1 className="doctor-schedule-title">Horarios de atención</h1>

          {availableDays.length === 0 && (
            <div className="no-schedule-message w-full max-w-2xl mx-auto">
              <Card className="no-schedule-card bg-white border border-[#E5E5E5] shadow-sm">
                <CardHeader>
                  <CardTitle className="no-schedule-title text-2xl font-bold text-[#7F0C43] text-center" style={{ fontFamily: "'Century Gothic', sans-serif" }}>Sin horarios disponibles</CardTitle>
                </CardHeader>
                <CardContent className="no-schedule-content text-center">
                  <AlertCircleIcon className="mx-auto h-12 w-12 text-[#7F0C43] mb-4" />
                  <p className="text-[#333333] mb-4" style={{ fontFamily: "Arial, sans-serif" }}>El Dr. {doctorInfo.name} no tiene horarios de consulta programados actualmente.</p>
                  <p className="text-[#666666]" style={{ fontFamily: "Arial, sans-serif" }}>Por favor, contacta directamente con el consultorio o regresa más tarde.</p>
                  <div className="mt-6">
                    <Button 
                      variant="outline"
                      onClick={() => router.back()}
                      className="border-[#7F0C43] text-[#7F0C43] hover:bg-[#F9F4F6]"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      Volver atrás
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

                    <div className={`w-full max-w-6xl mx-auto grid gap-8 ${
            consultaDays.length > 0 && procedimientoDays.length > 0 
              ? 'grid-cols-1 lg:grid-cols-2' 
              : 'grid-cols-1 max-w-2xl'
          }`}>
            {/* Días de Consulta */}
            {consultaDays.length > 0 && (
              <Card className="consultation-days-card bg-white border border-[#E5E5E5] shadow-sm">
                <CardHeader className="consultation-days-header">
                  <div className="flex items-center gap-3">
                    <ClipboardListIcon className="h-6 w-6 text-[#7F0C43]" />
                    <CardTitle className="consultation-days-title text-xl font-bold text-[#7F0C43]" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                      Días de Consulta
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="consultation-days-content">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {consultaDays.map((day) => {
                      const isSelected = selectedDay === day
                      return (
                        <Card
                          key={day}
                          onClick={() => { setSelectedDay(day); setSelectedKind('consulta') }}
                          className={`consultation-day-card${isSelected ? ' selected' : ''} flex flex-col items-center justify-center h-24 w-full text-center cursor-pointer transition-all duration-200 hover:shadow-md`}
                        >
                          <CardTitle className="consultation-day-title text-lg font-semibold text-[#7F0C43] mb-2" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                            {dayNames[day]}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <ClipboardListIcon className="h-4 w-4 text-[#7F0C43]" />
                            <CalendarCheckIcon className="h-4 w-4 text-[#7F0C43]" />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Días de Procedimiento */}
            {procedimientoDays.length > 0 && (
              <Card className="procedure-days-card bg-white border border-[#E5E5E5] shadow-sm">
                <CardHeader className="procedure-days-header">
                  <div className="flex items-center gap-3">
                    <ScissorsIcon className="h-6 w-6 text-[#7F0C43]" />
                    <CardTitle className="procedure-days-title text-xl font-bold text-[#7F0C43]" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                      Días de Procedimiento
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="procedure-days-content">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {procedimientoDays.map((day) => {
                      const isSelected = selectedDay === day
                      return (
                        <Card
                          key={day}
                          onClick={() => { setSelectedDay(day); setSelectedKind('procedimiento') }}
                          className={`procedure-day-card${isSelected ? ' selected' : ''} flex flex-col items-center justify-center h-24 w-full text-center cursor-pointer transition-all duration-200 hover:shadow-md`}
                        >
                          <CardTitle className="procedure-day-title text-lg font-semibold text-[#7F0C43] mb-2" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                            {dayNames[day]}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <ScissorsIcon className="h-4 w-4 text-[#7F0C43]" />
                            <CalendarCheckIcon className="h-4 w-4 text-[#7F0C43]" />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Selected Day Details */}
        <div ref={detailsRef} />
        {selectedDay && doctorSchedules?.[selectedDay] && (
          <div className="w-full flex flex-col items-center">
            <Card className="doctor-schedule-details-card w-full max-w-3xl mx-auto">
              <CardHeader className="doctor-schedule-details-header">
                <CardTitle className="doctor-schedule-details-title">
                    Detalles para {dayNames[selectedDay]}
                  </CardTitle>
                </CardHeader>
              <CardContent className="doctor-schedule-details-content">
                {(doctorSchedules[selectedDay] || [])
                  .filter(sched => {
                    if (!selectedKind) return true
                    return selectedKind === 'consulta' ? isConsulta(sched.tipo) : isProcedure(sched.tipo)
                  })
                  .map((sched, idx) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    <p className="doctor-schedule-details-row">
                      <CalendarCheckIcon className="doctor-schedule-details-icon" />
                      <span className="doctor-schedule-details-label">Horario:</span>{' '}
                      {sched.time} {sched.tipo ? `(${sched.tipo})` : ''}
                    </p>
                    <p className="doctor-schedule-details-row flex items-center gap-2 mb-2">
                      <DoorOpenIcon className="doctor-schedule-details-icon h-5 w-5 text-[#7F0C43]" />
                      <span className="doctor-schedule-details-label font-medium">Consultorio:</span>
                      <span>{sched.room}</span>
                    </p>
                    <p className="doctor-schedule-details-row flex items-center gap-2 mb-2">
                      <BuildingIcon className="doctor-schedule-details-icon h-5 w-5 text-[#7F0C43]" />
                      <span className="doctor-schedule-details-label font-medium">Edificio:</span>
                      <span>{sched.building}</span>
                    </p>
                    <p className="doctor-schedule-details-row flex items-center gap-2">
                      <MapPinIcon className="doctor-schedule-details-icon h-5 w-5 text-[#7F0C43]" />
                      <span className="doctor-schedule-details-label font-medium">Piso:</span>
                      <span>{sched.floor || 'No especificado'}</span>
                    </p>
                  </div>
                ))}
                </CardContent>
              </Card>

              <div className="w-full max-w-3xl mx-auto">
                <InteractiveMap
                  consultorio={((doctorSchedules[selectedDay] || [])
                    .filter(sched => {
                      if (!selectedKind) return true
                      return selectedKind === 'consulta' ? isConsulta(sched.tipo) : isProcedure(sched.tipo)
                    })[0])?.room}
                  building={((doctorSchedules[selectedDay] || [])
                    .filter(sched => {
                      if (!selectedKind) return true
                      return selectedKind === 'consulta' ? isConsulta(sched.tipo) : isProcedure(sched.tipo)
                    })[0])?.building}
                  floor={((doctorSchedules[selectedDay] || [])
                    .filter(sched => {
                      if (!selectedKind) return true
                      return selectedKind === 'consulta' ? isConsulta(sched.tipo) : isProcedure(sched.tipo)
                    })[0])?.floor}
                />
              </div>
          </div>
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