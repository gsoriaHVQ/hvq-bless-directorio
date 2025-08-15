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
  const { doctor: doctorSlug, specialty: specialtySlug } = params
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

        // 1. Obtener todas las especialidades para encontrar el ID real
        const specialtiesResponse = await axios.get('http://10.129.180.161:36560/api3/v1/especialidades/agenda', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const specialtiesData = specialtiesResponse.data
        const foundSpecialty = specialtiesData.find((spec: any) => 
          spec.descripcion?.toLowerCase().replace(/\s+/g, '-') === specialtySlug
        )

        if (!foundSpecialty) {
          throw new Error('Especialidad no encontrada')
        }

        // 2. Obtener todos los médicos de esa especialidad
        const doctorsResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/medico/especialidad/${foundSpecialty.especialidadId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const doctorsData = doctorsResponse.data
        const foundDoctor = doctorsData.find((doc: any) => 
          doc.nombres?.toLowerCase().replace(/\s+/g, '-') === doctorSlug
        )

        if (!foundDoctor) {
          throw new Error('Médico no encontrado')
        }

        // 3. Obtener información detallada del médico
        const doctorDetailResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/medico/${foundDoctor.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const doctorData = doctorDetailResponse.data

        // 4. Configurar información del médico
        setDoctorInfo({
          id: doctorData.id,
          name: doctorData.nombres || 'Nombre no disponible',
          specialty: foundSpecialty.descripcion || 'Especialidad no disponible',
          specialtyId: foundSpecialty.especialidadId,
          photo: doctorData.retrato
        })

        // 5. Obtener horarios disponibles para el médico
        const schedulesResponse = await axios.get('http://10.129.180.161:36560/api3/v1/turno/dia', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            especialidadId: foundSpecialty.especialidadId,
            medicoId: foundDoctor.id
          }
        })

        // Procesar los horarios según la estructura de TurnoDisponibilidad
        const formattedSchedules: Record<string, DoctorSchedule> = {}
        
        if (schedulesResponse.data?.disponibilidad) {
          schedulesResponse.data.disponibilidad.forEach((turno: any) => {
            try {
              const date = new Date(turno.horario)
              const day = date.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase()
              
              if (daysOfWeek.includes(day)) {
                formattedSchedules[day] = {
                  time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                  room: turno.recurso?.centralResourceDescription || 'Consultorio no asignado',
                  building: turno.recurso?.resourceType === 'EDIFICIO' 
                    ? turno.recurso.centralResourceDescription 
                    : 'Edificio Principal',
                  floor: turno.recurso?.resourceType === 'PISO' 
                    ? turno.recurso.centralResourceDescription 
                    : undefined
                }
              }
            } catch (e) {
              console.error('Error procesando horario:', turno.horario, e)
            }
          })
        }

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