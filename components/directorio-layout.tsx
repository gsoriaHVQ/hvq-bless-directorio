"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { HomeIcon, ArrowLeftIcon } from 'lucide-react'
import { CurrentTime } from "@/components/current-time"
import { Footer } from "@/components/footer"
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
    <div className="relative flex flex-col min-h-screen bg-background text-accent2">
      {/* Barra superior fija */}
      <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8 lg:px-12 h-24 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {displayBackButton && (
              <Button onClick={handleGoBack} className="bg-primary text-primary-foreground hover:bg-accent1 px-5 md:px-6 py-3 md:py-4 text-2xl md:text-3xl rounded-full shadow-md flex items-center gap-3">
                <ArrowLeftIcon className="w-6 h-6" />
                Volver
              </Button>
            )}
          </div>
          <div className="flex items-center justify-center">
            <CurrentTime />
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
      </header>

      <main className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        {children}
      </main>

      <Footer />
    </div>
  )
}
