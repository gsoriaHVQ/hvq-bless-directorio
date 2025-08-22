import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import 'react-simple-keyboard/build/css/index.css'
import IdleRedirect from '@/components/idle-redirect'
import DisableZoomAndContext from '@/components/disable-zoom-and-context'

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <DisableZoomAndContext />
        <IdleRedirect timeoutMs={30000} homePath="/">
          {children}
        </IdleRedirect>
      </body>
    </html>
  )
}
