import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DirectorioLayout } from "@/components/directorio-layout"
import { SearchIcon } from 'lucide-react'

export default function HomePage() {
  return (
    <DirectorioLayout showBackButton={false}>
      <div className="flex flex-col items-center justify-center h-full w-full text-center">
        {/* Logo HTQ en la parte superior */}
        <Image src="/images/htq-logo.png" alt="Logo HTQ" width={150} height={150} className="mb-8" />

        {/* Imagen del edificio */}
        <Image
          src="/images/homeline.png"
          alt="Edificio Médico"
          width={600}
          height={300}
          className="mb-12 object-contain"
        />

        {/* Botón "Encuentra a tu doctor" - ahora lleva a la pantalla de selección */}
        <Link href="/selection" passHref>
          <Button className="bg-primary text-primary-foreground hover:bg-accent1 text-4xl px-20 py-12 rounded-full shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center gap-4">
            <SearchIcon className="w-10 h-10" />
            Encuentra a tu doctor
          </Button>
        </Link>
      </div>
    </DirectorioLayout>
  )
}
