import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { DirectorioLayout } from "@/components/directorio-layout"
import { CreditCard, Passport, FileText } from 'lucide-react'

export default function DocumentSelectionPage() {
  return (
    <DirectorioLayout>
      <div style={{ paddingTop: '200px' }}>
        {/* Contenedor principal con fondo marrón oscuro */}
        <div className="document-selection-main-container">
          <h1 className="document-selection-title">Seleccione el tipo de documento:</h1>
          <div className="document-selection-three-columns-layout">
            <div className="document-selection-column">
              <Link href="/document/cedula" passHref>
                <Card className="document-selection-card">
                  <CardContent className="document-selection-card-content">
                    <CreditCard className="document-selection-card-icon" />
                    <CardTitle className="document-selection-card-title">Cédula</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </div>
            <div className="document-selection-column">
              <Link href="/document/pasaporte" passHref>
                <Card className="document-selection-card">
                  <CardContent className="document-selection-card-content">
                    <Passport className="document-selection-card-icon" />
                    <CardTitle className="document-selection-card-title">Pasaporte</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </div>
            <div className="document-selection-column">
              <Link href="/document/historia-clinica" passHref>
                <Card className="document-selection-card">
                  <CardContent className="document-selection-card-content">
                    <FileText className="document-selection-card-icon" />
                    <CardTitle className="document-selection-card-title">Historia Clínica</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Banner inferior como footer */}
        <div className="document-selection-footer-banner">
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative w-full rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden" style={{ aspectRatio: '2048 / 737' }}>
              <img
                src="http://horizon-html:35480/public/img_directorio/banner.png"
                alt="60 años de aniversario - Somos la familia que cuida de tu familia"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </DirectorioLayout>
  )
}
