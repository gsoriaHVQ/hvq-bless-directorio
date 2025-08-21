"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { HomeIcon, ArrowLeftIcon, Clock, HandHeart } from 'lucide-react'
import { CurrentTime } from "@/components/current-time"
import { Footer } from "@/components/footer"
import type { ReactNode } from "react"
import Image from "next/image"

interface DirectorioLayoutProps {
  children: ReactNode
  showBackButton?: boolean
}

export function DirectorioLayout({ children, showBackButton = true }: DirectorioLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const displayBackButton = showBackButton && pathname !== "/"
  const isHomePage = pathname === "/"

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-accent2">
      {/* Header según la página */}
      {isHomePage ? (
        // Header original para la página de inicio
        <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-8 lg:px-12 h-32 flex items-center justify-between gap-3">
            {/* Logo y nombre del hospital */}
            <div className="flex items-center gap-4">
              {displayBackButton && (
                <Button onClick={handleGoBack} className="bg-primary text-primary-foreground hover:bg-accent1 px-5 md:px-6 py-3 md:py-4 text-2xl md:text-3xl rounded-full shadow-md flex items-center gap-3">
                  <ArrowLeftIcon className="w-6 h-6" />
                  Volver
                </Button>
              )}
              <div className="flex items-center gap-3">
                <Image
                  src="http://horizon-html:35480/public/img_directorio/logo.svg"
                  alt="Hospital Vozandes Quito"
                  width={450}
                  height={450}
                  className="w-15 h-15"
                />
              </div>
            </div>
            
            {/* Hora y fecha centrada */}
            <div className="flex items-center justify-center">
              <CurrentTime />
            </div>
            
            {/* Botón de inicio */}
            <div className="flex items-center gap-2">
              {pathname !== "/" && (
                <Button onClick={handleGoHome} className="bg-primary text-primary-foreground hover:bg-accent1 px-5 md:px-6 py-3 md:py-4 text-2xl md:text-3xl rounded-full shadow-md flex items-center gap-3">
                  <HomeIcon className="w-6 h-6" />
                  Inicio
                </Button>
              )}
            </div>
          </div>
        </header>
      ) : (
        // Header nuevo para otras páginas
        <>
          <header className="sticky top-0 z-40 w-full bg-[#7F0C43] text-white rounded-b-2xl shadow-lg">
            <div className="mx-auto w-full max-w-6xl px-4 md:px-8 lg:px-12 h-24 flex items-center justify-between gap-3">
              {/* Logo y nombre del hospital */}
              <div className="flex items-center gap-3">
                <Image
                  src="/images/hvq_2025_1.png"
                  alt="Hospital Vozandes Quito"
                  width={200}
                  height={200}
                  className="w-15 h-15"
                />
              </div>
              
              {/* Hora y fecha centrada */}
              <div className="flex items-center justify-center gap-2">
                <CurrentTime variant="compact" />
              </div>
              
              {/* Información del paciente */}
              <div className="flex items-center gap-2">
                <HandHeart className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">HOLA, HVQ PACIENTE</span>
                </div>
              </div>
            </div>
          </header>
          
          {/* Botones debajo del header */}
          <div className="sticky top-24 z-30 w-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
            <div className="mx-auto w-full max-w-6xl px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {displayBackButton && (
                  <Button onClick={handleGoBack} className="bg-primary text-primary-foreground hover:bg-accent1 px-5 md:px-6 py-3 md:py-4 text-2xl md:text-3xl rounded-full shadow-md flex items-center gap-3">
                    <ArrowLeftIcon className="w-6 h-6" />
                    Volver
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {pathname !== "/" && (
                  <Button onClick={handleGoHome} className="bg-primary text-primary-foreground hover:bg-accent1 px-5 md:px-6 py-3 md:py-4 text-2xl md:text-3xl rounded-full shadow-md flex items-center gap-3">
                    <HomeIcon className="w-6 h-6" />
                    Inicio
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        {children}
      </main>

      <Footer />
    </div>
  )
}
