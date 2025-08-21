"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import "@/styles/pages.css"
import { DirectorioLayout } from "@/components/directorio-layout"
import { VirtualKeyboard } from "@/components/virtual-keyboard"
import { SearchIcon } from 'lucide-react'
import { DoctorCard } from "@/components/doctor-card"
import { Spinner } from "@/components/ui/spinner"
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
        const res = await apiService.getDoctores()
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
    const normalize = (s: string) => String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    const source = doctors.map((d: any) => {
      const id = String(d.id ?? d.codigo ?? d.codigo_prestador ?? d.codigoPrestador ?? '')
      const name = String(d.nombres ?? d.nombre ?? '')
      let specialtyId = ''
      let specialtyLabel = ''
      if (Array.isArray(d.especialidades) && d.especialidades.length > 0) {
        const first = d.especialidades[0]
        if (first && typeof first === 'object') {
          specialtyId = String((first as any).especialidadId ?? (first as any).id ?? (first as any).codigo ?? '')
          specialtyLabel = String((first as any).descripcion ?? '')
        } else {
          specialtyId = String(first)
        }
      } else {
        specialtyId = String(d.especialidadId ?? d.especialidad ?? '')
      }
      if (!specialtyLabel) specialtyLabel = specialtyId
      const photo = d.retrato ?? d.foto ?? null
      return { id, name, specialtyId, specialtyLabel, photo }
    })

    const trimmed = searchTerm.trim()
    if (trimmed) {
      const q = normalize(trimmed)
      return source
        .filter((doctor) => normalize(doctor.name).includes(q))
        .sort((a, b) => a.name.localeCompare(b.name))
    }

    // Sin búsqueda: mostrar 1 doctor por letra del abecedario (A-Z)
    const letterToDoctor: Record<string, { id: string; name: string; specialtyId: string; specialtyLabel: string; photo?: string | null }> = {}
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const normalizedList = source
      .map(d => ({ ...d, norm: normalize(d.name) }))
      .filter(d => d.norm.length > 0)

    letters.forEach(letter => {
      const lower = letter.toLowerCase()
      const found = normalizedList
        .filter(d => d.norm.startsWith(lower))
        .sort((a, b) => a.name.localeCompare(b.name))[0]
      if (found) {
        letterToDoctor[letter] = { id: found.id, name: found.name, specialtyId: found.specialtyId, specialtyLabel: (found as any).specialtyLabel, photo: found.photo }
      }
    })

    return letters
      .filter(l => !!letterToDoctor[l])
      .map(l => letterToDoctor[l])
      .slice(0, 24) // Límite razonable sin búsqueda
  }, [doctors, searchTerm])

  const handleEnter = () => {
    setIsKeyboardOpen(false)
  }

  const getSpecialtySlug = (nameOrId: string) => {
    const v = String(nameOrId || '')
    if (/^\d+$/.test(v)) return v
    return v
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  if (loading) {
    return (
      <DirectorioLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner size="lg" />
        </div>
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
      <div style={{ paddingTop: '200px' }}>
        <div className="sticky top-24 z-30 w-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          <div className="w-full px-0">
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
          </div>
        </div>
        <div className="w-full flex justify-center">
          <div className="w-full max-w-6xl">
            {filteredDoctors.length > 0 ? (
              <div className="doctor-search-three-columns-layout">
                {filteredDoctors.map((doctor, index) => {
                  const specSlug = getSpecialtySlug(String((doctor as any).specialtyId || ''))
                  const specLabel = String((doctor as any).specialtyLabel || (doctor as any).specialtyId || '')
                  return (
                    <div key={doctor.id} className="doctor-search-column">
                      <DoctorCard
                        doctor={doctor}
                        specialtyName={specLabel}
                        basePath={`/specialties/${specSlug}`}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="doctor-search-empty">
                {searchTerm ? "No se encontraron doctores con ese nombre." : "Empieza a escribir para buscar un doctor o selecciona uno de los doctores."}
              </p>
            )}
          </div>
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
      </div>
    </DirectorioLayout>
  )
}

