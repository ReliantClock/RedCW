'use client'

// ============================================================
//  components/layout/Header.tsx
//  Header sticky con logo, nav desktop, notificaciones y sesión
// ============================================================

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { useNotifications } from '@/components/providers/NotificationProvider'
import { createClient } from '@/lib/supabase/client'
import siteConfig from '@/site.config'
import {
  Home, Newspaper, Users, Bell, Settings, LogOut,
  User, ChevronDown, Moon, Sun, Shield, Menu, X
} from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

const navLinks = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/noticias', label: 'Noticias', icon: Newspaper },
  { href: '/comunidades', label: 'Comunidades', icon: Users },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuth()
  const { unreadCount } = useNotifications()
  const { theme, toggleTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="app-header">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        height: '100%',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>

        {/* ── Logo / Nombre ─────────────────────────────────── */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          flexShrink: 0,
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '16px',
            boxShadow: '0 2px 8px rgba(26,111,232,0.3)',
          }}>
            {siteConfig.name[0]}
          </div>
          <span style={{
            fontWeight: 800,
            fontSize: '18px',
            color: 'var(--color-primary)',
            letterSpacing: '-0.3px',
          }}>
            {siteConfig.name}
          </span>
        </Link>

        {/* ── Nav Desktop ──────────────────────────────────── */}
        <nav className="desktop-nav" style={{ gap: '4px', flex: 1, justifyContent: 'center' }}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '14px',
              fontWeight: isActive(href) ? 700 : 500,
              color: isActive(href) ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: isActive(href) ? 'var(--color-primary-muted)' : 'transparent',
              transition: 'all var(--transition)',
              textDecoration: 'none',
            }}>
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Acciones derecha ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>

          {/* Toggle tema */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: 'var(--radius-full)', border: 'none' }}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark'
              ? <Sun size={18} color="var(--color-text-muted)" />
              : <Moon size={18} color="var(--color-text-muted)" />
            }
          </button>

          {user && profile ? (
            <>
              {/* Notificaciones */}
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  position: 'relative',
                  padding: '8px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  transition: 'all var(--transition)',
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="pulse-dot" style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--color-error)',
                    border: '2px solid var(--color-bg-header)',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }} />
                )}
              </button>

              {/* Chip de sesión / Dropdown */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 12px 5px 5px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-bg-card)',
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Avatar */}
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.alias}
                      className="avatar"
                      style={{ width: '30px', height: '30px' }}
                    />
                  ) : (
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}>
                      {profile.alias[0].toUpperCase()}
                    </div>
                  )}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {profile.alias}
                  </span>
                  {/* Badge de plan */}
                  {profile.has_feed_badge && (
                    <span className={profile.plan === 'anon_pro' ? 'badge-pro' : 'badge-basic'}>
                      {profile.plan === 'anon_pro' ? '🔥' : '⭐'}
                    </span>
                  )}
                  <ChevronDown size={14} color="var(--color-text-muted)"
                    style={{ transition: 'transform var(--transition)', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
                  />
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="card slide-up" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '200px',
                    zIndex: 200,
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}>
                    {/* Info usuario */}
                    <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                        {profile.alias}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {profile.email}
                      </div>
                    </div>

                    <DropdownItem icon={User} label="Mi Perfil" href={`/perfil/${profile.id}`} onClick={() => setDropdownOpen(false)} />
                    <DropdownItem icon={Settings} label="Ajustes" href="/ajustes" onClick={() => setDropdownOpen(false)} />
                    {profile.role === 'admin' && (
                      <DropdownItem icon={Shield} label="Panel Admin" href="/admin" onClick={() => setDropdownOpen(false)} />
                    )}
                    <div className="divider" style={{ margin: '4px 0' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-error)',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'background var(--transition)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/auth/login" className="btn btn-ghost" style={{ fontSize: '14px', padding: '7px 16px' }}>
                Iniciar sesión
              </Link>
              <Link href="/auth/register" className="btn btn-primary" style={{ fontSize: '14px', padding: '7px 16px' }}>
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Dropdown Item ─────────────────────────────────────────────
function DropdownItem({
  icon: Icon, label, href, onClick
}: { icon: any; label: string; href: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '9px 12px',
      borderRadius: 'var(--radius-sm)',
      fontSize: '14px',
      fontWeight: 500,
      color: 'var(--color-text)',
      textDecoration: 'none',
      transition: 'background var(--transition)',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={16} color="var(--color-text-muted)" />
      {label}
    </Link>
  )
}
