import Image from "next/image"

export function Footer() {
  return (
    <footer className="absolute bottom-0 left-0 right-0 bg-background text-accent2 text-xs p-2 flex justify-between items-center border-t border-gray-200 z-20">
      <div className="text-left">v1.0.0</div>
      <div className="flex items-center gap-1 text-right">
        TICS | HOSPITAL VOZANDES QUITO
        <Image src="/images/htq-logo.png" alt="Logo HTQ Pequeño" width={20} height={20} className="ml-1" />
      </div>
    </footer>
  )
}
