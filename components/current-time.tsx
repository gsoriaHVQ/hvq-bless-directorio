"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge" 

export function CurrentTime() {
  // Mostrar hora local del navegador en texto sin forzar zona; no usar Date para formateo con TZ
  const [nowText, setNowText] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => {
      const d = new Date()
      const h24 = d.getHours()
      const mm = d.getMinutes().toString().padStart(2, '0')
      const ss = d.getSeconds().toString().padStart(2, '0')
      const ampm = h24 >= 12 ? 'PM' : 'AM'
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12
      const hh = h12.toString().padStart(2, '0')
      setNowText(`${hh}:${mm}:${ss} ${ampm}`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Badge suppressHydrationWarning className="bg-accent1 text-primary-foreground text-2xl md:text-3xl px-5 md:px-6 py-3 md:py-4 rounded-full shadow-md">
      {mounted ? nowText : ""}
    </Badge>
  )
}
