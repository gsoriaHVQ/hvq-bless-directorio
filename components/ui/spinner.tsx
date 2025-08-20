"use client"

import { cn } from "@/lib/utils"
import React from "react"

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | number
  className?: string
  ariaLabel?: string
}

export function Spinner({ size = "md", className, ariaLabel = "Cargando" }: SpinnerProps) {
  const sizePx = typeof size === "number" ? size : size === "sm" ? 24 : size === "lg" ? 48 : 32
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        "inline-block rounded-full animate-spin",
        // Borde gris para el círculo y primario para el segmento superior
        "border-4 border-muted border-t-primary",
        className
      )}
      style={{ width: sizePx, height: sizePx }}
    />
  )
}

export default Spinner


