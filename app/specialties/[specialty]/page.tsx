"use client"

import { DirectorioLayout } from "@/components/directorio-layout"
import { notFound } from "next/navigation"
import { DoctorCard } from "@/components/doctor-card"
import { useState, useEffect, useMemo } from "react"
import { use } from "react" // Importar el hook use
import axios from "axios"
import { getAccessToken } from "../../api/auth/auth"

interface Especialidad {
  especialidadId: number
  descripcion: string
  tipo?: string
  icono?: string
}

interface Medico {
  id: number
  nombres: string
  retrato?: string
  especialidades: Especialidad[]
}

interface DoctorsPageProps {
  params: Promise<{
    specialty: string
  }>
}

export default function DoctorsPage({ params }: DoctorsPageProps) {
  // Desempaquetar los parámetros con React.use()
  const { specialty: specialtyId } = use(params)
  const [allDoctors, setAllDoctors] = useState<Medico[]>([])
  const [specialtyName, setSpecialtyName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAccessToken()

        // 1. Obtener información de la especialidad
        const specialtyResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/especialidades/${specialtyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (!specialtyResponse.data?.descripcion) {
          throw new Error('Especialidad no encontrada')
        }
        setSpecialtyName(specialtyResponse.data.descripcion)

        // 2. Obtener todos los médicos con sus detalles
        const allDoctorsResponse = await axios.get('http://10.129.180.161:36560/api3/v1/medico', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        // Verificar si la respuesta es un array de IDs o de objetos completos
        const isArrayOfIds = Array.isArray(allDoctorsResponse.data) && 
          allDoctorsResponse.data.every((item: any) => typeof item === 'number')
        
        let doctorsData: Medico[] = []
        
        if (isArrayOfIds) {
          // 3a. Si es array de IDs, obtener detalles de cada médico
          const successfulDoctors: Medico[] = []
          
          // Usar Promise.allSettled para manejar errores individuales
          const results = await Promise.allSettled(
            allDoctorsResponse.data.map(async (doctorId: number) => {
              try {
                const doctorResponse = await axios.get(`http://10.129.180.161:36560/api3/v1/medico/${doctorId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                  }
                })
                return doctorResponse.data
              } catch (err) {
                console.error(`Error obteniendo médico ${doctorId}:`, (err as Error).message)
                return null
              }
            })
          )
          
          // Filtrar médicos válidos y que pertenecen a la especialidad
          results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
              const doctor = result.value
              if (doctor.especialidades?.some(esp => esp.especialidadId.toString() === specialtyId)) {
                successfulDoctors.push(doctor)
              }
            }
          })
          
          doctorsData = successfulDoctors
        } else {
          // 3b. Si ya son objetos completos, filtrar directamente
          doctorsData = allDoctorsResponse.data.filter((doctor: Medico) => 
            doctor.especialidades?.some(esp => esp.especialidadId.toString() === specialtyId)
          )
        }

        setAllDoctors(doctorsData)
      } catch (err) {
        console.error('Error fetching doctors:', err)
        setError('Error al cargar los doctores. Intente nuevamente más tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [specialtyId])

  // Agrupar doctores por letra inicial y limitar a 3 por letra
  const doctorsByLetter = useMemo(() => {
    const groups: Record<string, Medico[]> = {}
    const letters = ['A', 'B', 'C', 'D', 'E'] // Primeras 5 letras
    
    // Inicializar grupos para las primeras 5 letras
    letters.forEach(letter => {
      groups[letter] = []
    })

    // Filtrar y agrupar doctores
    allDoctors.forEach(doctor => {
      if (!doctor.nombres) return
      
      const firstLetter = doctor.nombres.charAt(0).toUpperCase()
      if (letters.includes(firstLetter)) {
        if (groups[firstLetter]?.length < 3) {
          groups[firstLetter].push(doctor)
        }
      }
    })

    return groups
  }, [allDoctors])

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(selectedLetter === letter ? null : letter)
  }

  if (loading) {
    return (
      <DirectorioLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando doctores...</p>
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

  if (!allDoctors.length || !specialtyName) {
    return (
      <DirectorioLayout>
        <h1 className="text-4xl font-bold text-primary mb-10 text-center">Doctores en {specialtyName || 'esta especialidad'}</h1>
        <p className="text-2xl text-accent2 col-span-full text-center">
          No se encontraron doctores para esta especialidad.
        </p>
      </DirectorioLayout>
    )
  }

  return (
    <DirectorioLayout>
      <h1 className="text-4xl font-bold text-primary mb-10 text-center">Doctores en {specialtyName}</h1>
      
      {/* Selector de letras */}
      <div className="flex justify-center gap-4 mb-8">
        {['A', 'B', 'C', 'D', 'E'].map(letter => (
          <button
            key={letter}
            onClick={() => handleLetterClick(letter)}
            className={`letter-filter ${doctorsByLetter[letter]?.length ? '' : 'disabled'} ${selectedLetter === letter ? 'active' : ''}`}
            disabled={!doctorsByLetter[letter]?.length}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Mostrar doctores por letra seleccionada o todos si no hay selección */}
      {selectedLetter ? (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Letra {selectedLetter}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doctorsByLetter[selectedLetter]?.map(doctor => (
              <DoctorCard
                key={doctor.id}
                doctor={{
                  id: doctor.id.toString(),
                  name: doctor.nombres,
                  photo: doctor.retrato,
                  specialty: specialtyName
                }}
                specialtyName={specialtyName}
                basePath={`/specialties/${specialtyId}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {Object.entries(doctorsByLetter).map(([letter, doctors]) => (
            doctors.length > 0 && (
              <div key={letter} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Letra {letter}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {doctors.map(doctor => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={{
                        id: doctor.id.toString(),
                        name: doctor.nombres,
                        photo: doctor.retrato,
                        specialty: specialtyName
                      }}
                      specialtyName={specialtyName}
                      basePath={`/specialties/${specialtyId}`}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </>
      )}
    </DirectorioLayout>
  )
}