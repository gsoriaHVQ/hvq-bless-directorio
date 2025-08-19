"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { XIcon, DeleteIcon, CornerDownLeftIcon } from 'lucide-react'
import { useEffect, useRef } from "react"

interface VirtualKeyboardProps {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  placeholder?: string
  onEnter?: () => void
}

export function VirtualKeyboard({ value, onChange, onClose, placeholder, onEnter }: VirtualKeyboardProps) {
  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    [" ", "-", ".", "@"],
  ]

  const keyboardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Añadir clase para mostrar con animación
    const timer = setTimeout(() => {
      if (keyboardRef.current) {
        keyboardRef.current.classList.add('show')
      }
    }, 10)
    
    return () => clearTimeout(timer)
  }, [])

  const handleKeyPress = (key: string) => {
    onChange(value + key)
  }

  const handleDelete = () => {
    onChange(value.slice(0, -1))
  }

  const handleClear = () => {
    onChange("")
  }

  const handleClose = () => {
    if (keyboardRef.current) {
      keyboardRef.current.classList.remove('show')
      // Esperar a que termine la animación antes de cerrar
      setTimeout(() => {
        onClose()
      }, 300)
    } else {
      onClose()
    }
  }

  return (
    <div className="virtual-keyboard-overlay" onClick={handleClose}>
      <div 
        ref={keyboardRef}
        className="virtual-keyboard-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="virtual-keyboard-header">
          <Input
            type="text"
            value={value}
            readOnly
            placeholder={placeholder}
            className="virtual-keyboard-input"
          />
          <Button onClick={handleClose} variant="ghost" size="icon" className="virtual-keyboard-close-btn">
            <XIcon className="w-6 h-6" />
            <span className="sr-only">Cerrar teclado</span>
          </Button>
        </div>
        
        <div className="virtual-keyboard-keys">
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="virtual-keyboard-row">
              {row.map((key) => (
                <Button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="virtual-keyboard-key"
                >
                  {key === " " ? "Espacio" : key}
                </Button>
              ))}
            </div>
          ))}
          <div className="virtual-keyboard-actions">
            <Button
              onClick={handleDelete}
              className="virtual-keyboard-action-btn delete"
            >
              <DeleteIcon className="w-5 h-5" />
              Borrar
            </Button>
            <Button
              onClick={handleClear}
              className="virtual-keyboard-action-btn clear"
            >
              Limpiar
            </Button>
            {onEnter && (
              <Button
                onClick={onEnter}
                className="virtual-keyboard-action-btn enter"
              >
                <CornerDownLeftIcon className="w-5 h-5" />
                Enter
              </Button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .virtual-keyboard-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 50;
          opacity: 0;
          animation: fadeIn 0.3s forwards;
        }
        
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        
        .virtual-keyboard-content {
          background-color: white;
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          width: 100%;
          max-width: 800px;
          padding: 16px;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }
        
        .virtual-keyboard-content.show {
          transform: translateY(0);
        }
        
        .virtual-keyboard-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .virtual-keyboard-input {
          flex: 1;
          font-size: 1.25rem;
          padding: 12px;
          text-align: center;
        }
        
        .virtual-keyboard-close-btn {
          flex-shrink: 0;
        }
        
        .virtual-keyboard-keys {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .virtual-keyboard-row {
          display: flex;
          justify-content: center;
          gap: 6px;
        }
        
        .virtual-keyboard-key {
          min-width: 44px;
          height: 44px;
          font-size: 1.125rem;
          font-weight: 500;
          border-radius: 8px;
          flex: 1;
        }
        
        .virtual-keyboard-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
        }
        
        .virtual-keyboard-action-btn {
          height: 44px;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 8px;
          flex: 1;
          max-width: 120px;
        }
        
        .virtual-keyboard-action-btn.delete {
          background-color: #f87171;
        }
        
        .virtual-keyboard-action-btn.clear {
          background-color: #94a3b8;
        }
        
        .virtual-keyboard-action-btn.enter {
          background-color: #4ade80;
        }
        
        @media (min-width: 640px) {
          .virtual-keyboard-content {
            padding: 24px;
          }
          
          .virtual-keyboard-key {
            min-width: 50px;
            height: 50px;
            font-size: 1.25rem;
          }
          
          .virtual-keyboard-action-btn {
            height: 50px;
            font-size: 1.125rem;
            max-width: 140px;
          }
        }
      `}</style>
    </div>
  )
}