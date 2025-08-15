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
import { getAccessToken } from "../api/auth/auth"

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
        const token = await getAccessToken()
        const response = await axios.get('http://10.129.180.161:36560/api3/v1/especialidades/agenda', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        // Filtrar, ordenar y obtener primera especialidad por letra inicial
        const filteredData = response.data
          .filter((esp: Especialidad) => esp.descripcion)
          .sort((a: Especialidad, b: Especialidad) => 
            (a.descripcion || '').localeCompare(b.descripcion || ''))
        
        // Obtener primera especialidad por letra
        const uniqueFirstLetters = new Set<string>()
        const firstByLetter = filteredData.filter(specialty => {
          if (!specialty.descripcion) return false
          const firstLetter = specialty.descripcion.charAt(0).toUpperCase()
          if (!uniqueFirstLetters.has(firstLetter)) {
            uniqueFirstLetters.add(firstLetter)
            return true
          }
          return false
        })
        
        setSpecialties(firstByLetter)
      } catch (err) {
        console.error('Error fetching specialties:', err)
        setError('Error al cargar las especialidades. Intente nuevamente más tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchSpecialties()
  }, [])

  // Dividir especialidades en columnas alternadas
  const columns = useMemo(() => {
    const filtered = searchTerm 
      ? specialties.filter(s => 
          s.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()))
      : specialties

    const leftColumn: Especialidad[] = []
    const rightColumn: Especialidad[] = []
    
    filtered.forEach((specialty, index) => {
      if (index % 2 === 0) {
        leftColumn.push(specialty)
      } else {
        rightColumn.push(specialty)
      }
    })
    
    return { leftColumn, rightColumn }
  }, [searchTerm, specialties])

  const handleEnter = () => {
    setIsKeyboardOpen(false)
  }

  if (loading) {
    return (
      <DirectorioLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando especialidades...</p>
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
      <div className="specialties-container">
        <h1 className="specialties-title">Especialidades Médicas</h1>
        <div className="specialties-input-container">
          <div className="specialties-input-wrapper">
            <Input
              type="text"
              placeholder="Buscar especialidad..."
              value={searchTerm}
              onFocus={() => setIsKeyboardOpen(true)}
              readOnly
              className="specialties-input"
            />
            <SearchIcon className="specialties-search-icon" />
          </div>
        </div>

        <div className="alternating-columns-layout">
          {/* Columna izquierda (A, C, E, ...) */}
          <div className="column left-column">
            {columns.leftColumn.map((specialty) => (
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

          {/* Columna derecha (B, D, F, ...) */}
          <div className="column right-column">
            {columns.rightColumn.map((specialty) => (
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

        {columns.leftColumn.length === 0 && columns.rightColumn.length === 0 && (
          <p className="specialties-empty">No se encontraron especialidades.</p>
        )}
      </div>

      {isKeyboardOpen && (
        <VirtualKeyboard
          value={searchTerm}
          onChange={setSearchTerm}
          onClose={() => setIsKeyboardOpen(false)}
          placeholder="Escribe aquí para buscar"
          onEnter={handleEnter}
        />
      )}
    </DirectorioLayout>
  )
}