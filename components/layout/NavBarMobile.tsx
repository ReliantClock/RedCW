'use client'

// ============================================================
//  components/layout/NavBarMobile.tsx
//  Barra de navegación inferior para móvil (estilo app nativa)
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Home, Newspaper, Users, User, LogIn } from 'lucide-react'

export default function NavBarMobile() {
  const pathname = usePathname()
  const { user, profile } = useAuth()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const links = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/noticias', label: 'Noticias', icon: Newspaper },
    { href: '/comunidades', label: 'Comunidades', icon: Users },
    user && profile
      ? { href: `/perfil/${profile.id}`, label: 'Perfil', icon: User }
      : { href: '/auth/login', label: 'Entrar', icon: LogIn },
  ]

  return (
    <nav className="app-nav" style={{
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 8px',
    }}>
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link key={href} href={href} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
            background: active ? 'var(--color-primary-muted)' : 'transparent',
            transition: 'all var(--transition)',
            flex: 1,
            justifyContent: 'center',
          }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500 }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
