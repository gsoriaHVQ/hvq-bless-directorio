"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import "@/styles/pages.css"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {DirectorioLayout } from "@/components/directorio-layout"
import { VirtualKeyboard } from "@/components/virtual-keyboard"
import { specialties as allSpecialties } from "@/lib/data"
import { SearchIcon } from 'lucide-react'
import * as LucideIcons from "lucide-react"

//icons
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const LucideIcon = (LucideIcons as any)[name]
  return LucideIcon ? <LucideIcon className={className} /> : null
}

export default function SpecialtiesPage() { 
  const [searchTerm, setSearchTerm] = useState("")
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const filteredSpecialties = useMemo(() => {
    if (!searchTerm) {
      return allSpecialties
    }
    return allSpecialties.filter((specialty) => specialty.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  //filtrar especialidades por nombre
  const handleEnter = () => {
    setIsKeyboardOpen(false)
  
  }

  return (
    <DirectorioLayout>
      <h1 className="specialties-title">Especialidades Médicas</h1>
      <div className="specialties-input-container">
        <div className="specialties-input-wrapper">
          <Input
            type="text"
            placeholder="Buscar especialidad..."
            value={searchTerm}
            onFocus={() => setIsKeyboardOpen(true)}
            readOnly
            className="specialties-input"
          />
          <SearchIcon className="specialties-search-icon" />
        </div>
      </div>

      <div className="specialties-grid">
        {filteredSpecialties.length > 0 ? (
          filteredSpecialties.map((specialty) => (
            <Link key={specialty.id} href={`/specialties/${specialty.id}`} passHref>
              <Card className="specialties-card group">
                <CardContent className="specialties-card-content">
                  <Icon
                    name={specialty.icon}
                    className="specialties-card-icon"
                  />
                  <CardTitle className="specialties-card-title">{specialty.name}</CardTitle>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <p className="specialties-empty">No se encontraron especialidades.</p>
        )}
      </div>

      {isKeyboardOpen && (
        <VirtualKeyboard
          value={searchTerm}
          onChange={setSearchTerm}
          onClose={() => setIsKeyboardOpen(false)}
          placeholder="Escribe aquí para buscar"
          onEnter={handleEnter}
        />
      )}
    </DirectorioLayout>
  )
}
