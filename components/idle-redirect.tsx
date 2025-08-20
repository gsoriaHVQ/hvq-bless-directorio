"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"

interface IdleRedirectProps {
  timeoutMs?: number
  homePath?: string
  children: React.ReactNode
}

export function IdleRedirect({ timeoutMs = 15000, homePath = "/", children }: IdleRedirectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        // Evitar redirigir si ya estamos en inicio
        if (pathname !== homePath) {
          router.push(homePath)
        }
      }, timeoutMs)
    }

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ]

    // Iniciar temporizador y listeners
    resetTimer()
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true } as AddEventListenerOptions))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((ev) => window.removeEventListener(ev, resetTimer))
    }
  }, [pathname, router, timeoutMs, homePath])

  return <>{children}</>
}

export default IdleRedirect


