"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge" 

export function CurrentTime() {
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formattedTime = time.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Guayaquil",
    hour12: true,
  })

  return (
    <Badge suppressHydrationWarning className="bg-accent1 text-primary-foreground text-2xl md:text-3xl px-5 md:px-6 py-3 md:py-4 rounded-full shadow-md">
      {mounted ? formattedTime : ""}
    </Badge>
  )
}
