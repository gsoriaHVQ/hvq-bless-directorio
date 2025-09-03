"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPinIcon, LocateFixedIcon, Volume2, VolumeX } from 'lucide-react' // Importar iconos de ubicación y volumen
import { useState, useRef } from "react"

interface InteractiveMapProps {
  consultorio: string
  building: string // Cambiado de 'tower' a 'building'
  floor?: string // Añadimos la propiedad de piso
}

export function InteractiveMap({ consultorio, building, floor }: InteractiveMapProps) {
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
    }
  }

  // Mapeo conceptual de edificios a posiciones en el mapa (ejemplo simplificado)
  // const buildingPositions: { [key: string]: { top: string; left: string } } = {
  //   "kkkk": { top: "30%", left: "25%" },
  //   "Bless": { top: "60%", left: "70%" },
  //   // Añade más edificios y posiciones si es necesario
  // }

  // const doctorLocation = buildingPositions[building] || { top: "50%", left: "50%" } // Posición por defecto si no se encuentra el edificio

  return (
    <Card className="w-full bg-white text-accent2 rounded-xl shadow-2xl p-6 mt-8">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-3xl font-bold text-primary text-center">Conoce el Hospital</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col items-center justify-center">
        <div className="relative w-full h-64 md:h-96 bg-black rounded-lg overflow-hidden flex items-center justify-center border-2 border-primary">
          {/* Video en bucle infinito, sin sonido, sin zoom, sin interacción del usuario */}
          <div className="absolute inset-0 overflow-hidden">
            <video
              ref={videoRef}
              className="absolute left-1/2 top-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none object-cover"
              src="http://prd-hvq-desarrollos:8001/videos/video_cumbre.mp4"
              title="Mapa en video"
              autoPlay
              muted={isMuted}
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
            />
          </div>
          
          {/* Botón de mutear/desmutear */}
          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 z-10"
            style={{
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? (
              <VolumeX className="w-7 h-7" />
            ) : (
              <Volume2 className="w-7 h-7" />
            )}
          </button>
        </div>
        {/*
        <p className="text-2xl mt-6 text-center">
          El consultorio <span className="font-semibold">{consultorio}</span> se encuentra en el{" "}
          <span className="font-semibold">{building}</span>.
          {floor && <span className="block text-xl mt-1">Piso: <span className="font-semibold">{floor}</span></span>}
        </p>
        <p className="text-xl text-center mt-2 text-muted-foreground">
          (Mapa conceptual del área. Para navegación interna, consulte la recepción.)
        </p>
        */}
      </CardContent>
    </Card>
  )
}
