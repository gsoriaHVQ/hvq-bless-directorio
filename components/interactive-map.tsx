import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPinIcon, LocateFixedIcon } from 'lucide-react' // Importar iconos de ubicación

interface InteractiveMapProps {
  consultorio: string
  building: string // Cambiado de 'tower' a 'building'
  floor?: string // Añadimos la propiedad de piso
}

export function InteractiveMap({ consultorio, building, floor }: InteractiveMapProps) {
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
          {/* Video en bucle, sin sonido, zoom 10%, sin interacción del usuario */}
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              className="absolute left-1/2 top-1/2 w-[110%] h-[110%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              src="http://prd-hvq-desarrollos:8001/videos/Expectativa%20Bless%20Health%20Tower%202.mp4"
              title="Mapa en video"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>

          {/* Marcador "Usted se encuentra aquí" (fijo para simulación)
          <div className="absolute top-[80%] left-[15%] bg-blue-500/80 rounded-full w-10 h-10 flex items-center justify-center animate-pulse z-10">
            <LocateFixedIcon className="w-6 h-6 text-white" />
            <span className="absolute -bottom-6 text-sm text-blue-700 font-semibold whitespace-nowrap">Usted aquí</span>
          </div> */}

          {/* Marcador de la ubicación del doctor (dinámico) */}
          {/* {doctorLocation && (
            <div
              className="absolute bg-accent1/80 rounded-full w-12 h-12 flex items-center justify-center animate-bounce z-10"
              style={{ top: doctorLocation.top, left: doctorLocation.left, transform: 'translate(-50%, -50%)' }}
            >
              <MapPinIcon className="w-7 h-7 text-primary-foreground" />
              <span className="absolute -top-6 text-sm text-accent2 font-semibold whitespace-nowrap">{building}</span>
            </div> */}
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
