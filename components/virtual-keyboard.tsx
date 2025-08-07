"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { XIcon, DeleteIcon, CornerDownLeftIcon } from 'lucide-react' // Importar CornerDownLeftIcon

interface VirtualKeyboardProps {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  placeholder?: string
  onEnter?: () => void // Nuevo prop para la acción de Enter
}

export function VirtualKeyboard({ value, onChange, onClose, placeholder, onEnter }: VirtualKeyboardProps) {
  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    [" ", "-", ".", "@"],
  ]

  const handleKeyPress = (key: string) => {
    onChange(value + key)
  }

  const handleDelete = () => {
    onChange(value.slice(0, -1))
  }

  const handleClear = () => {
    onChange("")
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl">
        <div className="flex justify-end items-center mb-4">
          {/* Eliminado el título "Teclado Táctil" */}
          <Button onClick={onClose} variant="ghost" size="icon" className="text-primary hover:text-accent1">
            <XIcon className="w-8 h-8" />
            <span className="sr-only">Cerrar teclado</span>
          </Button>
        </div>
        <Input
          type="text"
          value={value}
          readOnly
          placeholder={placeholder}
          className="w-full text-3xl p-4 mb-6 text-center border-2 border-primary focus:border-accent1 rounded-lg"
        />
        <div className="grid gap-2">
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2">
              {row.map((key) => (
                <Button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="bg-secondary text-accent2 hover:bg-primary hover:text-primary-foreground text-2xl font-semibold w-16 h-16 rounded-lg shadow-md flex items-center justify-center"
                >
                  {key === " " ? "Espacio" : key}
                </Button>
              ))}
            </div>
          ))}
          <div className="flex justify-center gap-2 mt-3">
            <Button
              onClick={handleDelete}
              className="bg-accent1 text-primary-foreground hover:bg-accent2 text-2xl font-semibold px-6 py-4 rounded-lg shadow-md flex items-center gap-2"
            >
              <DeleteIcon className="w-6 h-6" />
              Borrar
            </Button>
            <Button
              onClick={handleClear}
              className="bg-accent1 text-primary-foreground hover:bg-accent2 text-2xl font-semibold px-6 py-4 rounded-lg shadow-md"
            >
              Limpiar
            </Button>
            {onEnter && (
              <Button
                onClick={onEnter}
                className="bg-primary text-primary-foreground hover:bg-accent1 text-2xl font-semibold px-6 py-4 rounded-lg shadow-md flex items-center gap-2"
              >
                <CornerDownLeftIcon className="w-6 h-6" />
                Enter
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
