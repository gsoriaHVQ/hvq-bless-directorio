"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import "@/styles/pages.css"
import { DirectorioLayout} from "@/components/directorio-layout"
import { VirtualKeyboard } from "@/components/virtual-keyboard"
import { SearchIcon } from 'lucide-react'
import { DoctorCard } from "@/components/doctor-card"
import { apiService } from "@/lib/api-service"

export default function DoctorSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiService.getDoctors()
        const list = Array.isArray(res.data) ? res.data : (Array.isArray((res.data as any)?.data) ? (res.data as any).data : [])
        if (!cancelled) {
          setDoctors(list as any[])
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando médicos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filteredDoctors = useMemo(() => {
    const source = doctors.map((d: any) => {
      const rawFirstSpec = Array.isArray(d.especialidades) && d.especialidades.length > 0 ? d.especialidades[0] : null
      const specialtyId = String(
        rawFirstSpec && typeof rawFirstSpec === 'object' && 'especialidadId' in rawFirstSpec
          ? (rawFirstSpec as any).especialidadId
          : rawFirstSpec ?? d.especialidadId ?? d.especialidad ?? ''
      )
      const specialtyName = String(
        rawFirstSpec && typeof rawFirstSpec === 'object' && 'descripcion' in rawFirstSpec
          ? (rawFirstSpec as any).descripcion
          : specialtyId
      )
      return {
        id: String(d.id ?? d.codigo ?? d.codigo_prestador ?? d.codigoPrestador ?? ''),
        name: String(d.nombres ?? d.nombre ?? ''),
        specialtyId,
        specialtyName,
        photo: d.retrato ?? d.foto ?? null
      }
    })
    if (!searchTerm) return source
    const q = searchTerm.toLowerCase()
    return source.filter((doctor) => doctor.name.toLowerCase().includes(q))
  }, [doctors, searchTerm])

  const handleEnter = () => {
    setIsKeyboardOpen(false)
  }

  const getSpecialtySlug = (nameOrId: string) => {
    const v = String(nameOrId || '')
    if (/^\d+$/.test(v)) return v
    return v.toLowerCase().replace(/\s+/g, '-')
  }

  if (loading) {
    return (
      <DirectorioLayout>
        <p className="doctor-search-empty">Cargando médicos...</p>
      </DirectorioLayout>
    )
  }

  if (error) {
    return (
      <DirectorioLayout>
        <p className="doctor-search-empty">{error}</p>
      </DirectorioLayout>
    )
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
              specialtyName={doctor.specialtyName}
              basePath={`/specialties/${getSpecialtySlug(doctor.specialtyId)}`}
            />
          ))
        ) : (
          <p className="doctor-search-empty">
            {searchTerm ? "No se encontraron doctores con ese nombre." : "Empieza a escribir para buscar un doctor o selecciona uno de los doctores."}
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
