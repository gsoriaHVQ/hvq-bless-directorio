import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { DirectorioLayout } from "@/components/directorio-layout"
import { StethoscopeIcon, UserSearchIcon, FileTextIcon } from 'lucide-react'

export default function SelectionPage() {
  return (
    <DirectorioLayout>
      <div style={{ paddingTop: '20px' }}>
        {/* Contenedor principal con fondo marrón oscuro */}
        <div className="selection-main-container" style={{ borderTopLeftRadius: '2rem', borderTopRightRadius: '2rem' }}>
          <h1 className="selection-title">¿Cómo deseas buscar?</h1>
          <div className="selection-three-columns-layout" style={{ alignItems: 'stretch', paddingBottom: '25px' }}>
            <div className="selection-column" style={{ order: 1 }}>
              <Link href="/specialties" passHref>
                <Card className="selection-card" style={{ height: '28rem' }}>
                  <CardContent className="selection-card-content" style={{ height: '100%', padding: '3rem 4rem' }}>
                    <StethoscopeIcon className="selection-card-icon" style={{ width: '10rem', height: '10rem' }} />
                    <CardTitle className="selection-card-title">Buscar por Especialidad</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </div>
            <div className="selection-column" style={{ order: 2 }}>
              <Link href="/doctors/search" passHref>
                <Card className="selection-card" style={{ height: '28rem' }}>
                  <CardContent className="selection-card-content" style={{ height: '100%', padding: '3rem 4rem' }}>
                    <UserSearchIcon className="selection-card-icon" style={{ width: '10rem', height: '10rem' }} />
                    <CardTitle className="selection-card-title">Buscar por Médico</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Banner inferior como footer */}
        <div className="mt-20 md:mt-24 w-full px-4">
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative w-full rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden" style={{ aspectRatio: '2048 / 737' }}>
              <Image
                src="http://horizon-html:35480/public/img_directorio/banner.png"
                alt="Encuentra a tu especialista en nuestro Directorio Médico"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </DirectorioLayout>
  )
}
