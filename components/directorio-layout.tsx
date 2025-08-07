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
      <header className="flex justify-between items-center mb-8">
        {displayBackButton ? (
          <Button
            onClick={handleGoBack}
            className="bg-primary text-primary-foreground hover:bg-accent1 text-xl px-6 py-4 rounded-lg shadow-lg flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-6 h-6" />
            Volver
          </Button>
        ) : (
          <div className="w-[120px]" />
        )}
        <CurrentTime />
        <Button
          onClick={handleGoHome}
          className="bg-primary text-primary-foreground hover:bg-accent1 text-xl px-6 py-4 rounded-lg shadow-lg flex items-center gap-2"
        >
          <HomeIcon className="w-6 h-6" />
          Inicio
        </Button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto pb-10"> {/* Añadido pb-10 para espacio del footer */}
        {children}
      </main>
    
      <Footer /> 
    </div>
  )
}
