import Image from "next/image"

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-transparent text-accent2 text-xs p-2 flex justify-between items-center z-20">
      <div className="text-left">v1.0.0</div>
      <div className="flex items-center gap-1 text-right">
        TICS | HOSPITAL VOZANDES QUITO
        <Image src="http://horizon-html:35480/public/img_directorio/aplicativo_logo.svg" alt="Logo HTQ Pequeño" width={20} height={20} className="ml-1" />
      </div>
    </footer>
  )
}
