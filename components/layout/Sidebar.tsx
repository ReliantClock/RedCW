'use client'

// ============================================================
//  components/layout/Sidebar.tsx
//  Sidebar derecho con info del sitio, accesos rápidos y planes
// ============================================================

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Forum } from '@/lib/types'
import siteConfig from '@/site.config'
import { Users, TrendingUp, Shield, ExternalLink } from 'lucide-react'

interface SidebarProps {
  currentProfile: Profile | null
}

export default function Sidebar({ currentProfile }: SidebarProps) {
  const [activeForums, setActiveForums] = useState<Forum[]>([])
  const [userCount, setUserCount] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Foros populares
    supabase.from('forums').select('*')
      .eq('is_active', true).eq('type', 'public')
      .order('member_count', { ascending: false })
      .limit(4)
      .then(({ data }) => setActiveForums(data || []))

    // Conteo de usuarios
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count }) => setUserCount(count))
  }, [])

  return (
    <>
      {/* ── Tarjeta del sitio ─────────────────────────────── */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'var(--color-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '18px',
            boxShadow: '0 2px 8px rgba(26,111,232,0.3)',
          }}>
            {siteConfig.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-text)' }}>
              {siteConfig.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {siteConfig.tagline}
            </div>
          </div>
        </div>

        {userCount !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-primary-muted)',
            fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600,
            marginBottom: '12px',
          }}>
            <Users size={14} />
            {userCount.toLocaleString()} miembros activos
          </div>
        )}

        {!currentProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/auth/register" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Crear cuenta gratis
            </Link>
            <Link href="/auth/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}>
              Ya tengo cuenta
            </Link>
          </div>
        )}
      </div>

      {/* ── Foros populares ───────────────────────────────── */}
      {activeForums.length > 0 && (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginBottom: '12px', fontWeight: 700, fontSize: '14px',
          }}>
            <TrendingUp size={15} color="var(--color-primary)" />
            Comunidades populares
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {activeForums.map(forum => (
              <Link key={forum.id} href={`/comunidades/${forum.id}`} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                textDecoration: 'none', color: 'var(--color-text)',
                transition: 'background var(--transition)',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: forum.avatar_url ? 'transparent' : 'var(--color-primary-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', overflow: 'hidden',
                }}>
                  {forum.avatar_url
                    ? <img src={forum.avatar_url} alt={forum.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : forum.type === 'anonymous' ? '👤' : forum.name[0].toUpperCase()
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {forum.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {forum.member_count} miembros
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/comunidades" style={{
            display: 'block', textAlign: 'center', marginTop: '8px',
            fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600,
            padding: '6px', borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
          }}>
            Ver todas →
          </Link>
        </div>
      )}

      {/* ── Plan actual / upgrade ─────────────────────────── */}
      {currentProfile && currentProfile.plan === 'free' && (
        <div className="card" style={{
          padding: '16px',
          background: 'linear-gradient(135deg, var(--color-primary-muted), var(--color-accent-light))',
          border: '1px solid var(--color-primary)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
            💎 Desbloquea más
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
            Crea foros anónimos, publica sin identidad y destaca tu contenido.
          </p>
          <Link href="/ajustes?tab=planes" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}>
            Ver planes desde S/ 5/mes
          </Link>
        </div>
      )}

      {/* ── Admin link ────────────────────────────────────── */}
      {currentProfile?.role === 'admin' && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <Link href="/admin" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'var(--color-primary)', fontWeight: 600, fontSize: '14px', textDecoration: 'none',
          }}>
            <Shield size={15} />
            Panel de administración
            <ExternalLink size={12} style={{ marginLeft: 'auto' }} />
          </Link>
        </div>
      )}

      {/* ── Footer mini ───────────────────────────────────── */}
      <div style={{ padding: '8px 4px', fontSize: '11px', color: 'var(--color-text-light)', lineHeight: '1.8' }}>
        <a href={`mailto:${siteConfig.supportEmail}`} style={{ color: 'inherit' }}>Soporte</a>
        {' · '}
        <a href={`mailto:${siteConfig.contactEmail}`} style={{ color: 'inherit' }}>Contacto</a>
        <br />
        © {new Date().getFullYear()} {siteConfig.name}
      </div>
    </>
  )
}
