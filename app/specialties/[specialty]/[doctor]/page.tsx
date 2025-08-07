"use client"

import { DirectorioLayout } from "@/components/directorio-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { doctors as allDoctors, schedules as allSchedules } from "@/lib/data"
import { notFound } from "next/navigation"
import { useState } from "react"
import { DoorOpenIcon, BuildingIcon, CalendarCheckIcon } from 'lucide-react' 
import { InteractiveMap } from "@/components/interactive-map" 

interface SchedulePageProps {
  params: {
    specialty: string
    doctor: string
  }
}
type DoctorSchedule = {
  time: string
  room: string
  building: string
  floor?: string
}
export default function SchedulePage({ params }: SchedulePageProps) {
  const { doctor: doctorId } = params
  const doctorInfo = Object.values(allDoctors)
    .flat()
    .find((d) => d.id === doctorId)
  const doctorSchedules = allSchedules[doctorId as keyof typeof allSchedules] as Record<string, DoctorSchedule> | undefined

  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  if (!doctorInfo || !doctorSchedules) {
    notFound()
  }

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

  return (
    <DirectorioLayout>
      <h1 className="doctor-schedule-title">Horarios del {doctorInfo.name}</h1>

      <div className="doctor-schedule-days-grid">
        {daysOfWeek.map((day) => (
          <Card
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`doctor-schedule-day-card${selectedDay === day ? " selected" : ""}${!doctorSchedules[day as keyof typeof doctorSchedules] ? " unavailable" : ""}`}
          >
            <CardTitle className="doctor-schedule-day-title">{dayNames[day]}</CardTitle>
            {doctorSchedules[day as keyof typeof doctorSchedules] ? (
              <CalendarCheckIcon className="doctor-schedule-day-icon" />
            ) : (
              <p className="doctor-schedule-day-nodisponible">No disponible</p>
            )}
          </Card>
        ))}
      </div>

      {selectedDay && doctorSchedules[selectedDay as keyof typeof doctorSchedules] && (
        <>
          <Card className="doctor-schedule-details-card">
            <CardHeader className="doctor-schedule-details-header">
              <CardTitle className="doctor-schedule-details-title">
                Detalles para {dayNames[selectedDay]}
              </CardTitle>
            </CardHeader>
            <CardContent className="doctor-schedule-details-content">
              <p className="doctor-schedule-details-row">
                <CalendarCheckIcon className="doctor-schedule-details-icon" />
                <span className="doctor-schedule-details-label">Horario:</span>{" "}
                {doctorSchedules[selectedDay as keyof typeof doctorSchedules].time}
              </p>
              <p className="doctor-schedule-details-row">
                <DoorOpenIcon className="doctor-schedule-details-icon" />
                <span className="doctor-schedule-details-label">Consultorio:</span>{" "}
                {doctorSchedules[selectedDay as keyof typeof doctorSchedules].room}
              </p>
              <p className="doctor-schedule-details-row">
                <BuildingIcon className="doctor-schedule-details-icon" />
                <span className="doctor-schedule-details-label">Edificio:</span>{" "}
                {doctorSchedules[selectedDay as keyof typeof doctorSchedules].building}
              </p>
            </CardContent>
          </Card>

          {/* Nuevo componente de mapa interactivo */}
          <InteractiveMap
            consultorio={doctorSchedules[selectedDay as keyof typeof doctorSchedules].room}
            building={doctorSchedules[selectedDay as keyof typeof doctorSchedules].building}
            floor={doctorSchedules[selectedDay as keyof typeof doctorSchedules].floor}
          />
        </>
      )}

      {selectedDay && !doctorSchedules[selectedDay as keyof typeof doctorSchedules] && (
        <Card className="doctor-schedule-empty-card">
          <CardTitle className="doctor-schedule-empty-title">
            ¡Atención!
          </CardTitle>
          <p className="doctor-schedule-empty-text">
            El {doctorInfo.name} no tiene horario disponible para el <b>{dayNames[selectedDay]}</b>.
          </p>
          <p className="doctor-schedule-empty-subtext">
            Por favor, selecciona otro día o regresa a la lista de doctores.
          </p>
        </Card>
      )}
    </DirectorioLayout>
  )
}
