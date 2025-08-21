import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { DirectorioLayout } from "@/components/directorio-layout"
import { StethoscopeIcon, UserSearchIcon } from 'lucide-react'

export default function SelectionPage() {
  return (
    <DirectorioLayout>
      <div style={{ paddingTop: '200px' }}>
        <h1 className="selection-title">¿Cómo deseas buscar?</h1>

        {/* Banner del inicio */}
        <div className="mb-12 w-full px-4">
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative w-full rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden" style={{ aspectRatio: '2048 / 737' }}>
              <Image
                src="/images/KIOSKO_BANNERS_Directorio Médico-04.png"
                alt="Encuentra a tu especialista en nuestro Directorio Médico"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="selection-grid">
          <Link href="/specialties" passHref>
            <Card className="selection-card">
              <CardContent className="selection-card-content">
                <StethoscopeIcon className="selection-card-icon" />
                <CardTitle className="selection-card-title">Buscar por Especialidad</CardTitle>
              </CardContent>
            </Card>
          </Link>
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
    </DirectorioLayout>
  )
}
