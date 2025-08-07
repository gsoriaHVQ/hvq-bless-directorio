"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import "@/styles/pages.css"
import { DirectorioLayout} from "@/components/directorio-layout"
import { VirtualKeyboard } from "@/components/virtual-keyboard"
import { allDoctorsFlat, specialties as allSpecialties } from "@/lib/data"
import { SearchIcon } from 'lucide-react'
import { DoctorCard } from "@/components/doctor-card"

export default function DoctorSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  //llamar a la api para buscar doctores por nombre
  const filteredDoctors = useMemo(() => {
    if (!searchTerm) {
      return allDoctorsFlat.slice(0, 3) 
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return allDoctorsFlat.filter((doctor) => doctor.name.toLowerCase().includes(lowerCaseSearchTerm))
  }, [searchTerm])

  const handleEnter = () => {
    setIsKeyboardOpen(false)
  }

  const getSpecialtyName = (specialtyId: string) => {
    return allSpecialties.find((s) => s.id === specialtyId)?.name || "Especialidad Desconocida"
  }

  return (
    <DirectorioLayout>
      <h1 className="doctor-search-title">Buscar Doctor por Nombre</h1>
      <div className="doctor-search-input-container">
        <div className="doctor-search-input-wrapper">
          <Input
            type="text"
            placeholder="Escribe el nombre del doctor..."
            value={searchTerm}
            onFocus={() => setIsKeyboardOpen(true)}
            readOnly
            className="doctor-search-input"
          />
          <SearchIcon className="doctor-search-icon" />
        </div>
      </div>
      <div className="doctor-search-grid">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              specialtyName={getSpecialtyName(doctor.specialtyId)}
              basePath={`/specialties/${doctor.specialtyId}`}
            />
          ))
        ) : (
          <p className="doctor-search-empty">
            {searchTerm ? "No se encontraron doctores con ese nombre." : "Empieza a escribir para buscar un doctor o selecciona uno de los doctores de prueba."}
          </p>
        )}
      </div>

      {isKeyboardOpen && (
        <VirtualKeyboard
          value={searchTerm}
          onChange={setSearchTerm}
          onClose={() => setIsKeyboardOpen(false)}
          placeholder="Buscar por nombre del doctor"
          onEnter={handleEnter}
        />
      )}
    </DirectorioLayout>
  )
}
