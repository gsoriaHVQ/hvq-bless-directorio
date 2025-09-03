"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge" 
import type { CurrentTimeProps } from "@/lib/types"

export function CurrentTime({ variant = 'full' }: CurrentTimeProps) {
  const [nowText, setNowText] = useState("")
  const [dateText, setDateText] = useState("")
  const [compactTime, setCompactTime] = useState("")
  const [compactDate, setCompactDate] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => {
      const d = new Date()
      
      // Formato de hora (más grande)
      const h24 = d.getHours()
      const mm = d.getMinutes().toString().padStart(2, '0')
      const ss = d.getSeconds().toString().padStart(2, '0')
      const h12 = ((h24 + 11) % 12) + 1
      const ampm = h24 >= 12 ? 'PM' : 'AM'
      setNowText(`${h12}:${mm}:${ss} ${ampm}`)
      
      // Formato de fecha en español
      const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      
      const diaSemana = dias[d.getDay()]
      const dia = d.getDate()
      const mes = meses[d.getMonth()]
      const año = d.getFullYear()
      
      setDateText(`${diaSemana} ${dia} de ${mes} ${año}`)
      
      // Formato compacto para el nuevo header
      const diasCortos = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
      const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      
      const diaSemanaCorto = diasCortos[d.getDay()]
      const mesCorto = mesesCortos[d.getMonth()]
      
      setCompactTime(`${h12}:${mm} ${ampm}`)
      // En compacto, sólo la fecha debajo (sin hora)
      setCompactDate(`${diaSemanaCorto} ${dia} ${mesCorto} ${año}`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{mounted ? compactTime : "9:52 AM"}</span>
          <span className="text-xs">{mounted ? compactDate : "mié 21 may 2025"}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Badge suppressHydrationWarning className="bg-accent1 text-primary-foreground text-4xl md:text-5xl px-6 md:px-8 pt-6 md:pt-8 pb-4 md:pb-5 rounded-full shadow-md font-bold">
        {mounted ? nowText : ""}
      </Badge>
      <div className="text-lg md:text-xl font-semibold text-gray-700">
        {mounted ? dateText : ""}
      </div>
    </div>
  )
}
