import {DirectorioLayout  } from "@/components/directorio-layout"
import Link from "next/link"
import { doctors as allDoctors, specialties as allSpecialties } from "@/lib/data"
import { notFound } from "next/navigation"
import { DoctorCard } from "@/components/doctor-card" 

interface DoctorsPageProps {
  params: {
    specialty: string
  }
}

export default function DoctorsPage({ params }: DoctorsPageProps) {
  const { specialty: specialtyId } = params
  const doctorsInSpecialty = allDoctors[specialtyId as keyof typeof allDoctors]
  const specialtyName = allSpecialties.find((s) => s.id === specialtyId)?.name

  if (!doctorsInSpecialty || !specialtyName) {
    notFound() 
  }

  return (
    <DirectorioLayout>
      <h1 className="text-4xl font-bold text-primary mb-10 text-center">Doctores en {specialtyName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {doctorsInSpecialty.length > 0 ? (
          doctorsInSpecialty.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              specialtyName={specialtyName}
              basePath={`/specialties/${specialtyId}`} 
            />
          ))
        ) : (
          <p className="text-2xl text-accent2 col-span-full text-center">
            No se encontraron doctores para esta especialidad.
          </p>
        )}
      </div>
    </DirectorioLayout>
  )
}
