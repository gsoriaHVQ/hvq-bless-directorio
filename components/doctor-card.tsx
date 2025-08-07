import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { UserRoundIcon as UserRoundMedical } from 'lucide-react'

interface DoctorCardProps {
  doctor: {
    id: string
    name: string
    specialtyId: string
  }
  specialtyName: string
  basePath: string // Para construir el link correctamente
}

export function DoctorCard({ doctor, specialtyName, basePath }: DoctorCardProps) {
  return (
    <Link key={doctor.id} href={`${basePath}/${doctor.id}`} passHref>
      <Card className="bg-secondary text-accent2 hover:bg-primary hover:text-primary-foreground transition-colors duration-200 cursor-pointer rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 flex flex-col items-center justify-center p-6 h-64 group">
        <CardContent className="flex flex-col items-center justify-center p-0">
          <UserRoundMedical className="w-24 h-24 mb-3 text-primary group-hover:text-primary-foreground" />
          <CardTitle className="text-3xl font-bold text-center">{doctor.name}</CardTitle>
          <p className="text-xl text-accent2 text-center mt-1">{specialtyName}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
