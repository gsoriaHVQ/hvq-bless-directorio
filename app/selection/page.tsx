import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import "@/styles/pages.css"
import { DirectorioLayout} from "@/components/directorio-layout"
import { StethoscopeIcon, UserSearchIcon } from 'lucide-react' 

export default function SelectionPage() {
  return (
    <DirectorioLayout>
      <h1 className="selection-title">¿Cómo deseas buscar?</h1>
      <div className="selection-grid">
        <Link href="/specialties" passHref>
          <Card className="selection-card">
            <CardContent className="selection-card-content">
              <StethoscopeIcon className="selection-card-icon" />
              <CardTitle className="selection-card-title">Buscar por Especialidad</CardTitle>
            </CardContent>
          </Card>
        </Link>
        <Link href="/doctors/search" passHref>
          <Card className="selection-card">
            <CardContent className="selection-card-content">
              <UserSearchIcon className="selection-card-icon" />
              <CardTitle className="selection-card-title">Buscar por Médico</CardTitle>
            </CardContent>
          </Card>
        </Link>
      </div>
    </DirectorioLayout>
  )
}
