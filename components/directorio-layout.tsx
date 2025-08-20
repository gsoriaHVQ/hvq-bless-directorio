"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { HomeIcon, ArrowLeftIcon } from 'lucide-react'
import { CurrentTime } from "@/components/current-time"
import { Footer} from "@/components/footer" 
import type { ReactNode } from "react"

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

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-accent2 p-4 md:p-8 lg:p-12">
      <header className="flex justify-center items-center mb-10 md:mb-12">
        <CurrentTime />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto pb-10"> {/* Añadido pb-10 para espacio del footer */}
        {children}
      </main>
    
      {/* Botones flotantes accesibles */}
      {displayBackButton && (
        <div className="fixed left-6 bottom-6 md:left-8 md:bottom-8 z-40">
          <Button
            onClick={handleGoBack}
            className="bg-primary text-primary-foreground hover:bg-accent1 text-2xl px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <ArrowLeftIcon className="w-7 h-7" />
            Volver
          </Button>
        </div>
      )}
      {pathname !== "/" && (
        <div className="fixed right-6 bottom-6 md:right-8 md:bottom-8 z-40">
          <Button
            onClick={handleGoHome}
            className="bg-primary text-primary-foreground hover:bg-accent1 text-2xl px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <HomeIcon className="w-7 h-7" />
            Inicio
          </Button>
        </div>
      )}

      <Footer /> 
    </div>
  )
}
