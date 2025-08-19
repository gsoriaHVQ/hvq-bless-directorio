import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { UserRoundIcon as UserRoundMedical, Loader2 as Loader2Icon } from 'lucide-react'
import { memo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface DoctorCardProps {
  doctor: {
    id: string
    name: string
    photo?: string | null
  }
  specialtyName: string
  basePath: string
  className?: string
  variant?: 'default' | 'compact'
}

export const DoctorCard = memo(function DoctorCard({ doctor, specialtyName, basePath, className, variant = 'default' }: DoctorCardProps) {
  const [hasImageError, setHasImageError] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(Boolean(doctor.photo))
  const showIcon = !doctor.photo || hasImageError
  const isCompact = variant === 'compact'
  
  // Verificar si el nombre excede los 28 caracteres
  const isLongName = doctor.name.length > 28
  const isLongSpecialty = specialtyName.length > 28
  
  // Calcular tamaños de texto con reducción del 20% para nombres largos
  const nameSize = isLongName 
    ? `${isCompact ? 'text-base' : 'text-xl'}`
    : `${isCompact ? 'text-lg' : 'text-2xl'}`
  
  const specialtySize = isLongSpecialty
    ? `${isCompact ? 'text-xs' : 'text-sm'}`
    : `${isCompact ? 'text-sm' : 'text-lg'}`

  return (
    <Link key={doctor.id} href={`${basePath}/${doctor.id}`} passHref>
      <Card className={`bg-secondary text-accent2 hover:bg-primary hover:text-primary-foreground transition-colors duration-200 cursor-pointer rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 flex flex-col items-center justify-center p-4 h-[16.8rem] w-[326.4px] group ${className || ''}`}>
        <CardContent className="flex flex-col items-center justify-center p-4 w-full">
          {showIcon ? (
            <UserRoundMedical className="w-16 h-16 mb-3 text-primary group-hover:text-primary-foreground" aria-hidden="true" />
          ) : (
            <div className="relative mb-3" style={{ width: 80, height: 80 }}>
              {isImageLoading && (
                <>
                  <Skeleton className="w-[80px] h-[80px] rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2Icon className="w-4 h-4 text-primary animate-spin" aria-label="Cargando" />
                  </div>
                </>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doctor.photo as string}
                alt={`Foto de ${doctor.name}`}
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
                draggable={false}
                className={`rounded-full object-cover ${isImageLoading ? 'invisible' : ''}`}
                onLoad={() => setIsImageLoading(false)}
                onError={() => {
                  setHasImageError(true)
                  setIsImageLoading(false)
                }}
              />
            </div>
          )}
          <div className="w-full px-2">
            <CardTitle className={`${nameSize} font-bold text-center leading-tight mb-2 line-clamp-2`}>
              {doctor.name}
            </CardTitle>
            <p className={`${specialtySize} text-accent2 text-center leading-tight line-clamp-2`}>
              {specialtyName}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})