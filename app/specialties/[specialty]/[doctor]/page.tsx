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

        // 1. Resolver especialidad por ID o por slug de manera directa (sin fallbacks extra)
        const isSpecialtyId = /^\d+$/.test(specialtySlug)
        let foundSpecialty: any
        if (isSpecialtyId) {
          const res = await axios.get(`http://10.129.180.166:36560/api3/v1/especialidades/${specialtySlug}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          foundSpecialty = res.data
        } else {
          const res = await axios.get('http://10.129.180.166:36560/api3/v1/especialidades/agenda', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const list = Array.isArray(res.data) ? res.data : []
          foundSpecialty = list.find((spec: any) => slugify(String(spec.descripcion || '')) === slugify(String(specialtySlug)))
        }

        if (!foundSpecialty) throw new Error('Especialidad no encontrada')

        // 2. Resolver médico por ID o por slug de manera directa
        const isDoctorId = /^\d+$/.test(doctorSlug)
        let doctorData: any
        let doctorIdToUse: number
        if (isDoctorId) {
          const res = await axios.get(`http://10.129.180.166:36560/api3/v1/medico/${doctorSlug}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          doctorData = res.data
          doctorIdToUse = doctorData.id
        } else {
          const res = await axios.get(`http://10.129.180.166:36560/api3/v1/medico/especialidad/${foundSpecialty.especialidadId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const list = Array.isArray(res.data) ? res.data : []
          const foundDoctor = list.find((doc: any) => slugify(String(doc.nombres || '')) === slugify(String(doctorSlug)))
          if (!foundDoctor) throw new Error('Médico no encontrado')
          const detail = await axios.get(`http://10.129.180.166:36560/api3/v1/medico/${foundDoctor.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          doctorData = detail.data
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

        // Eliminar datos hardcodeados para consultorio/piso; usar solo lo que entregue la API

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
            room: item.consultorioDescripcion || 'No especificado',
            building: item.edificioDescripcion || (item as any).buildingCode || 'No especificado',
            floor: item.piso || (item as any).pisoDescripcion || (item as any).des_piso || 'No especificado',
            tipo: item.tipoTexto || undefined,
          }
          if (!formattedSchedules[dayKey]) formattedSchedules[dayKey] = []
          formattedSchedules[dayKey].push(entry)
        })

        setDoctorSchedules(formattedSchedules)
        
        // Auto-expandir lógica: prioridad 1) día actual, 2) un solo día disponible
        const availableDays = Object.keys(formattedSchedules).filter((d) => daysOfWeek.includes(d))
        
        // Obtener el día actual
        const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase()
        const todayKey = normalizeDayKey(today)
        
        let dayToSelect: string | null = null
        
        // Prioridad 1: Si el día actual está disponible, seleccionarlo
        if (availableDays.includes(todayKey)) {
          dayToSelect = todayKey
        }
        // Prioridad 2: Si solo hay un día disponible, seleccionarlo
        else if (availableDays.length === 1) {
          dayToSelect = availableDays[0]
        }
        
        if (dayToSelect) {
          setSelectedDay(dayToSelect)
          // Determinar el tipo automáticamente si solo hay un tipo en ese día
          const daySchedules = formattedSchedules[dayToSelect]
          const hasConsulta = daySchedules.some(sched => isConsulta(sched.tipo))
          const hasProcedimiento = daySchedules.some(sched => isProcedure(sched.tipo))
          
          if (hasConsulta && !hasProcedimiento) {
            setSelectedKind('consulta')
          } else if (hasProcedimiento && !hasConsulta) {
            setSelectedKind('procedimiento')
          }
          // Si tiene ambos tipos, no establecer selectedKind para mostrar todos
        }
        
        setLoading(false)
      } catch (err) {
        // En producción, no deberíamos loggear errores de usuario
        // console.error('Error fetching data:', err)
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

  // Función para determinar si un día debe estar seleccionado visualmente
  const isDaySelected = (day: string, kind: 'consulta' | 'procedimiento') => {
    if (selectedDay !== day) return false
    if (!selectedKind) return false
    return selectedKind === kind
  }

  // Función para validar y mostrar el nombre del edificio según el código
  const getBuildingDisplayName = (buildingCode: string | number | undefined): string => {
    if (!buildingCode) return 'No especificado'
    
    const code = String(buildingCode).trim()
    
    // Validación específica para códigos 1 y 2
    if (code === '1') return 'Principal'
    if (code === '2') return 'Torre Bless'
    
    // Para otros códigos, mantener la lógica actual
    return code
  }

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
                className="text-white hover:bg-[#C84D80]"
                style={{ fontFamily: "Arial, sans-serif", backgroundColor: '#8C3048' }}
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
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 rounded-xl shadow-sm p-6 border border-[#E5E5E5]">
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
          <h1 className="text-3xl font-bold text-[#7F0C43] mb-8 text-center" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
            Horarios del Dr. {doctorInfo.name}
          </h1>

          {availableDays.length === 0 && (
            <div className="no-schedule-message w-full max-w-2xl mx-auto">
              <Card className="no-schedule-card border border-[#E5E5E5] shadow-lg">
                <CardHeader>
                  <CardTitle className="no-schedule-title text-2xl font-bold text-[#7F0C43] text-center" style={{ fontFamily: "'Century Gothic', sans-serif" }}>Sin horarios disponibles</CardTitle>
                </CardHeader>
                <CardContent className="no-schedule-content text-center">
                  <AlertCircleIcon className="mx-auto h-12 w-12 text-[#7F0C43] mb-4" />
                  <p className="text-[#333333] mb-4" style={{ fontFamily: "Arial, sans-serif" }}>El Dr. {doctorInfo.name} no tiene horarios de consulta programados actualmente.</p>
                  <p className="text-[#666666]" style={{ fontFamily: "Arial, sans-serif" }}>Por favor, contacta directamente con información o regresa más tarde.</p>
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      className="text-white hover:bg-[#C84D80]"
                      style={{ fontFamily: "Arial, sans-serif", backgroundColor: '#8C3048' }}
                    >
                      Volver atrás
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="w-full max-w-6xl mx-auto">
            <div className={`grid gap-8 mb-8 ${
              consultaDays.length > 0 && procedimientoDays.length > 0 
                ? 'md:grid-cols-2' 
                : 'grid-cols-1 place-items-center'
            }`}>
              {/* Días de Consulta */}
              {consultaDays.length > 0 && (
                <Card className={`bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 shadow-lg rounded-2xl overflow-hidden ${
                  procedimientoDays.length === 0 ? 'max-w-md w-full' : ''
                }`}>
                  <CardHeader className="bg-gradient-to-r from-pink-100 to-rose-100 pb-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="bg-[#7F0C43] p-2 rounded-full">
                        <ClipboardListIcon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-[#7F0C43]" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                        Días de Consulta
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {consultaDays.map((day) => {
                        const daySchedules = (doctorSchedules || {})[day]?.filter(sched => isConsulta(sched.tipo)) || []
                        const isSelected = isDaySelected(day, 'consulta')
                        return (
                          <Card
                            key={day}
                            onClick={() => { setSelectedDay(day); setSelectedKind('consulta') }}
                            className={`bg-[#7F0C43] hover:bg-[#A31E47] transition-all duration-300 cursor-pointer rounded-xl overflow-hidden ${
                              isSelected ? 'ring-4 ring-[#C84D80] shadow-xl scale-105' : 'shadow-md hover:shadow-lg'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                {/* Íconos a la izquierda */}
                                <div className="flex items-center gap-2">
                                  <ClipboardListIcon className="h-6 w-6 text-white" />
                                  <CalendarCheckIcon className="h-6 w-6 text-white" />
                                </div>
                                
                                {/* Nombre del día en el centro */}
                                <CardTitle className="text-lg font-bold text-white text-center flex-1 mx-4" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                                  {dayNames[day]}
                                </CardTitle>
                                
                                {/* Horario a la derecha */}
                                <div className="flex-shrink-0">
                                  {daySchedules.length > 0 && (
                                    <div className="bg-white/20 rounded-lg px-3 py-2">
                                      <span className="text-white font-medium text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
                                        {daySchedules[0].time}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Días de Procedimiento */}
              {procedimientoDays.length > 0 && (
                <Card className={`bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 shadow-lg rounded-2xl overflow-hidden ${
                  consultaDays.length === 0 ? 'max-w-md w-full' : ''
                }`}>
                  <CardHeader className="bg-gradient-to-r from-pink-100 to-rose-100 pb-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="bg-[#7F0C43] p-2 rounded-full">
                        <ScissorsIcon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-[#7F0C43]" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                        Días de Procedimiento
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {procedimientoDays.map((day) => {
                        const daySchedules = (doctorSchedules || {})[day]?.filter(sched => isProcedure(sched.tipo)) || []
                        const isSelected = isDaySelected(day, 'procedimiento')
                        return (
                          <Card
                            key={day}
                            onClick={() => { setSelectedDay(day); setSelectedKind('procedimiento') }}
                            className={`bg-[#7F0C43] hover:bg-[#A31E47] transition-all duration-300 cursor-pointer rounded-xl overflow-hidden ${
                              isSelected ? 'ring-4 ring-[#C84D80] shadow-xl scale-105' : 'shadow-md hover:shadow-lg'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                {/* Íconos a la izquierda */}
                                <div className="flex items-center gap-2">
                                  <ScissorsIcon className="h-6 w-6 text-white" />
                                  <CalendarCheckIcon className="h-6 w-6 text-white" />
                                </div>
                                
                                {/* Nombre del día en el centro */}
                                <CardTitle className="text-lg font-bold text-white text-center flex-1 mx-4" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                                  {dayNames[day]}
                                </CardTitle>
                                
                                {/* Horario a la derecha */}
                                <div className="flex-shrink-0">
                                  {daySchedules.length > 0 && (
                                    <div className="bg-white/20 rounded-lg px-3 py-2">
                                      <span className="text-white font-medium text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
                                        {daySchedules[0].time}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Selected Day Details */}
        <div ref={detailsRef} />
        {selectedDay && doctorSchedules?.[selectedDay] && (
          <div className="w-full flex flex-col items-center max-w-4xl mx-auto px-4">
            {/* Título con ícono */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-[#7F0C43] p-4 rounded-full mb-4">
                <ClipboardListIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#7F0C43] mb-2 text-center" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                Detalles para {dayNames[selectedDay]}
              </h2>
              {selectedKind && (
                <div className="bg-pink-200 px-4 py-2 rounded-full">
                  <span className="text-[#7F0C43] font-medium capitalize" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                    {selectedKind}
                  </span>
                </div>
              )}
            </div>
            
            {/* Grid de detalles 2x2 */}
            <div className="w-full max-w-3xl">
              {(doctorSchedules[selectedDay] || [])
                .filter(sched => {
                  if (!selectedKind) return true
                  return selectedKind === 'consulta' ? isConsulta(sched.tipo) : isProcedure(sched.tipo)
                })
                .slice(0, 1) // Solo mostrar el primer horario
                .map((sched, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Horario */}
                    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="bg-[#7F0C43] p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                          <ClockIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-[#7F0C43] mb-2 uppercase tracking-wide" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                          HORARIO
                        </h3>
                        <p className="text-2xl font-bold text-[#7F0C43]" style={{ fontFamily: "Arial, sans-serif" }}>
                          {sched.time}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Consultorio */}
                    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="bg-[#7F0C43] p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                          <DoorOpenIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-[#7F0C43] mb-2 uppercase tracking-wide" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                          CONSULTORIO
                        </h3>
                        <p className="text-2xl font-bold text-[#7F0C43]" style={{ fontFamily: "Arial, sans-serif" }}>
                          {sched.room}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Edificio */}
                    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="bg-[#7F0C43] p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                          <BuildingIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-[#7F0C43] mb-2 uppercase tracking-wide" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                          EDIFICIO
                        </h3>
                        <p className="text-2xl font-bold text-[#7F0C43]" style={{ fontFamily: "Arial, sans-serif" }}>
                          {getBuildingDisplayName(sched.building)}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Piso */}
                    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="bg-[#7F0C43] p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                          <MapPinIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-[#7F0C43] mb-2 uppercase tracking-wide" style={{ fontFamily: "'Century Gothic', sans-serif" }}>
                          PISO
                        </h3>
                        <p className="text-2xl font-bold text-[#7F0C43]" style={{ fontFamily: "Arial, sans-serif" }}>
                          {sched.floor || 'No especificado'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
            </div>

            {/* Mapa interactivo */}
            <div className="w-full max-w-3xl mx-auto mt-8">
              <InteractiveMap
                consultorio={((doctorSchedules[selectedDay] || [])
                  .filter(sched => {
                    if (!selectedKind) return true
                    return selectedKind === 'consulta' ? isConsulta(sched.tipo) : isProcedure(sched.tipo)
                  })[0])?.room}
                building={getBuildingDisplayName(((doctorSchedules[selectedDay] || [])
                  .filter(sched => {
                    if (!selectedKind) return true
                    return selectedKind === 'consulta' ? isConsulta(sched.tipo) : isProcedure(sched.tipo)
                  })[0])?.building)}
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