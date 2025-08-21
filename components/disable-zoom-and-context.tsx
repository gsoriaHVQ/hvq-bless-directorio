"use client"

import { useEffect } from 'react'

export default function DisableZoomAndContext() {
  useEffect(() => {
    const preventDefault = (event: Event) => {
      event.preventDefault()
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const zoomKeys = [
          'Equal',
          'NumpadAdd',
          'Minus',
          'NumpadSubtract',
          'Digit0',
        ]
        if (zoomKeys.includes(event.code)) {
          event.preventDefault()
        }
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    document.addEventListener('contextmenu', preventDefault, { passive: false })
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    window.addEventListener('gesturestart', preventDefault as EventListener, { passive: false } as AddEventListenerOptions)
    window.addEventListener('dblclick', preventDefault as EventListener, { passive: false } as AddEventListenerOptions)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      document.removeEventListener('contextmenu', preventDefault)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('gesturestart', preventDefault as EventListener)
      window.removeEventListener('dblclick', preventDefault as EventListener)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return null
}


