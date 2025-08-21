"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import "@/styles/pages.css"
import "@/styles/especialidades.css"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { DirectorioLayout } from "@/components/directorio-layout"
import { VirtualKeyboard } from "@/components/virtual-keyboard"
import { SearchIcon } from 'lucide-react'
import axios from "axios"
import { getAccessToken } from "../../lib/auth"
import { Spinner } from "@/components/ui/spinner"

interface Especialidad {
  especialidadId: number
  descripcion: string | null
  tipo: string | null
  icono: string | null
}

export default function SpecialtiesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [specialties, setSpecialties] = useState<Especialidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        // Cacheado simple en sessionStorage por 60s
        const cacheKey = 'specialties_agenda_cache_v1'
        const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed?.ts && Date.now() - parsed.ts < 60000 && Array.isArray(parsed.data)) {
            setSpecialties(parsed.data)
            return
          }
        }

        const token = await getAccessToken()
        const response = await axios.get('http://10.129.180.161:36560/api3/v1/especialidades/agenda', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        // Traer TODAS las especialidades válidas, ordenadas alfabéticamente
        const fullList = (response.data as Especialidad[])
          .filter((esp: Especialidad) => Boolean(esp.descripcion))
          .sort((a: Especialidad, b: Especialidad) => (a.descripcion || '').localeCompare(b.descripcion || ''))
        setSpecialties(fullList)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: fullList }))
        }
      } catch (err) {
        console.error('Error fetching specialties:', err)
        setError('Error al cargar las especialidades. Intente nuevamente más tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchSpecialties()
  }, [])

  // Dividir especialidades en 3 columnas
  const columns = useMemo(() => {
    const filtered = searchTerm
      ? specialties.filter(s =>
        s.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()))
      : specialties

    const column1: Especialidad[] = []
    const column2: Especialidad[] = []
    const column3: Especialidad[] = []

    filtered.forEach((specialty, index) => {
      if (index % 3 === 0) {
        column1.push(specialty)
      } else if (index % 3 === 1) {
        column2.push(specialty)
      } else {
        column3.push(specialty)
      }
    })

    const total = filtered.length

    // Si hay un sobrante de 1 (total % 3 === 1), centrar la última tarjeta en la columna del medio
    if (total % 3 === 1 && column1.length > column2.length) {
      const last = column1.pop()
      if (last) column2.push(last)
    }

    // Si hay exactamente 2 resultados, colocarlos centrados en la columna del medio
    if (total === 2) {
      column1.length = 0
      column3.length = 0
      column2.length = 0
      filtered.forEach((item) => column2.push(item))
    }

    return { column1, column2, column3, total }
  }, [searchTerm, specialties])

  const handleEnter = () => {
    setIsKeyboardOpen(false)
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
        <div className="error-container">
          <h2>Error</h2>
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

  return (
    <DirectorioLayout>
      <div className="specialties-container" style={{ paddingTop: '200px' }}>
        <div className="sticky top-24 z-30 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          <div className="w-full px-0">
            <h1 className="specialties-title">Especialidades Médicas</h1>
            <div className="doctor-search-input-container" style={{ maxWidth: '100%' }}>
              <div className="doctor-search-input-wrapper" style={{ width: '100%' }}>
                <Input
                  type="text"
                  placeholder="Buscar especialidad..."
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

        {columns.total === 1 ? (
          <div className="w-full flex justify-center" style={{ marginTop: '2rem' }}>
            {(() => {
              const specialty = columns.column1[0] || columns.column2[0] || columns.column3[0]
              if (!specialty) return null
              return (
                <Link
                  key={specialty.especialidadId}
                  href={`/specialties/${specialty.especialidadId}`}
                  passHref
                >
                  <Card className="specialties-card group">
                    <CardContent className="specialties-card-content">
                      {specialty.icono ? (
                        <div className="specialties-icon-container">
                          <img
                            src={specialty.icono}
                            alt={`Icono de ${specialty.descripcion}`}
                            className="specialties-card-icon"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="specialties-default-icon">
                    
                        </div>
                      )}
                      <CardTitle className="specialties-card-title">
                        {specialty.descripcion || 'Especialidad sin nombre'}
                      </CardTitle>
                    </CardContent>
                  </Card>
                </Link>
              )
            })()}
          </div>
        ) : (
          <div className="three-columns-layout" style={{ marginTop: '2rem' }}>
            {/* Columna 1 */}
            <div className="column">
              {columns.column1.map((specialty) => (
                <Link
                  key={specialty.especialidadId}
                  href={`/specialties/${specialty.especialidadId}`}
                  passHref
                >
                  <Card className="specialties-card group">
                    <CardContent className="specialties-card-content">
                      {specialty.icono ? (
                        <div className="specialties-icon-container">
                          <img
                            src={specialty.icono}
                            alt={`Icono de ${specialty.descripcion}`}
                            className="specialties-card-icon"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="specialties-default-icon">
                          <span className="text-2xl">🏥</span>
                        </div>
                      )}
                      <CardTitle className="specialties-card-title">
                        {specialty.descripcion || 'Especialidad sin nombre'}
                      </CardTitle>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Columna 2 */}
            <div className="column">
              {columns.column2.map((specialty) => (
                <Link
                  key={specialty.especialidadId}
                  href={`/specialties/${specialty.especialidadId}`}
                  passHref
                >
                  <Card className="specialties-card group">
                    <CardContent className="specialties-card-content">
                      {specialty.icono ? (
                        <div className="specialties-icon-container">
                          <img
                            src={specialty.icono}
                            alt={`Icono de ${specialty.descripcion}`}
                            className="specialties-card-icon"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="specialties-default-icon">
                          <span className="text-2xl">🏥</span>
                        </div>
                      )}
                      <CardTitle className="specialties-card-title">
                        {specialty.descripcion || 'Especialidad sin nombre'}
                      </CardTitle>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Columna 3 */}
            <div className="column">
              {columns.column3.map((specialty) => (
                <Link
                  key={specialty.especialidadId}
                  href={`/specialties/${specialty.especialidadId}`}
                  passHref
                >
                  <Card className="specialties-card group">
                    <CardContent className="specialties-card-content">
                      {specialty.icono ? (
                        <div className="specialties-icon-container">
                          <img
                            src={specialty.icono}
                            alt={`Icono de ${specialty.descripcion}`}
                            className="specialties-card-icon"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="specialties-default-icon">
                          <span className="text-2xl">🏥</span>
                        </div>
                      )}
                      <CardTitle className="specialties-card-title">
                        {specialty.descripcion || 'Especialidad sin nombre'}
                      </CardTitle>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {columns.column1.length === 0 && columns.column2.length === 0 && columns.column3.length === 0 && (
          <p className="specialties-empty">No se encontraron especialidades.</p>
        )}
      </div>

      {isKeyboardOpen && (
        <VirtualKeyboard
          value={searchTerm}
          onChange={setSearchTerm}
          onClose={() => setIsKeyboardOpen(false)}
          onEnter={handleEnter}
        />
      )}
    </DirectorioLayout>
  )
}