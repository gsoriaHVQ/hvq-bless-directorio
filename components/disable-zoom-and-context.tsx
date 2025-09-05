"use client"

import { useEffect } from 'react'

export default function DisableZoomAndContext() {
  useEffect(() => {
    const preventDefault = (event: Event) => {
      event.preventDefault()
    }

    // Prevenir zoom con rueda del mouse + Ctrl
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
      }
    }

    // Prevenir zoom con teclado (Ctrl + +, Ctrl + -, Ctrl + 0)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const zoomKeys = [
          'Equal',
          'NumpadAdd',
          'Minus',
          'NumpadSubtract',
          'Digit0',
          'Key0'
        ]
        if (zoomKeys.includes(event.code)) {
          event.preventDefault()
        }
      }
    }

    // Prevenir zoom táctil con múltiples dedos
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    // Prevenir gestos de zoom (pinch-to-zoom)
    const handleGestureStart = (event: Event) => {
      event.preventDefault()
    }

    const handleGestureChange = (event: Event) => {
      event.preventDefault()
    }

    const handleGestureEnd = (event: Event) => {
      event.preventDefault()
    }

    // Prevenir doble tap para zoom
    const handleDoubleClick = (event: Event) => {
      event.preventDefault()
    }

    // Prevenir menú contextual
    const handleContextMenu = (event: Event) => {
      event.preventDefault()
    }

    // Agregar estilos CSS para desactivar zoom
    const style = document.createElement('style')
    style.textContent = `
      * {
        touch-action: pan-x pan-y !important;
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      html, body {
        touch-action: pan-x pan-y !important;
        -webkit-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
      }
      
      input, textarea, select {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `
    document.head.appendChild(style)

    // Agregar meta viewport para prevenir zoom
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no'
      document.head.appendChild(meta)
    }

    // Event listeners
    document.addEventListener('contextmenu', handleContextMenu, { passive: false })
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    window.addEventListener('gesturestart', handleGestureStart, { passive: false })
    window.addEventListener('gesturechange', handleGestureChange, { passive: false })
    window.addEventListener('gestureend', handleGestureEnd, { passive: false })
    window.addEventListener('dblclick', handleDoubleClick, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      // Limpiar event listeners
      document.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('gesturestart', handleGestureStart)
      window.removeEventListener('gesturechange', handleGestureChange)
      window.removeEventListener('gestureend', handleGestureEnd)
      window.removeEventListener('dblclick', handleDoubleClick)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      
      // Remover estilos
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [])

  return null
}