import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { DirectorioLayout } from "@/components/directorio-layout"
import { StethoscopeIcon, UserSearchIcon, FileTextIcon } from 'lucide-react'

export default function SelectionPage() {
  return (
    <DirectorioLayout>
      <div style={{ paddingTop: '200px' }}>
        {/* Contenedor principal con fondo marrón oscuro */}
        <div className="selection-main-container">
          <h1 className="selection-title">¿Cómo deseas buscar?</h1>
          <div className="selection-three-columns-layout">
            <div className="selection-column">
              <Link href="/specialties" passHref>
                <Card className="selection-card">
                  <CardContent className="selection-card-content">
                    <StethoscopeIcon className="selection-card-icon" />
                    <CardTitle className="selection-card-title">Buscar por Especialidad</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </div>
            <div className="selection-column">
              <Link href="/doctors/search" passHref>
                <Card className="selection-card">
                  <CardContent className="selection-card-content">
                    <UserSearchIcon className="selection-card-icon" />
                    <CardTitle className="selection-card-title">Buscar por Médico</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Banner inferior como footer */}
        <div className="selection-footer-banner">
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
