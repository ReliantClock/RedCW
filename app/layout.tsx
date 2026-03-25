// ============================================================
//  app/layout.tsx
//  Layout raíz - Providers de tema, auth y notificaciones
// ============================================================

import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Merriweather } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import siteConfig from '@/site.config'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: ['red social', 'educación', 'colegios', 'estudiantes', 'comunidad'],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${merriweather.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
