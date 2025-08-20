import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import 'react-simple-keyboard/build/css/index.css'
import IdleRedirect from '@/components/idle-redirect'

export const metadata: Metadata = {
  title: 'hvq-dir',
  description: 'Directorio Edificio Bless',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <IdleRedirect timeoutMs={90000} homePath="/">
          {children}
        </IdleRedirect>
      </body>
    </html>
  )
}
