'use client'

// ============================================================
//  app/(main)/ajustes/page.tsx
//  Ajustes completos del usuario
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import siteConfig from '@/site.config'
import type { Forum, GalleryImage } from '@/lib/types'
import {
  User, RefreshCw, MessageSquare, Image as ImageIcon,
  Moon, Sun, CreditCard, LogOut, ChevronRight, ArrowLeft,
  Mail, Phone, ExternalLink, Check, Loader2, Shield
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/components/providers/ThemeProvider'

type Tab = 'perfil' | 'foros' | 'galeria' | 'modo' | 'planes' | null

const menuItems = [
  { id: 'perfil', label: 'Perfil', icon: User, desc: 'Edita tu alias, bio y fotos' },
  { id: 'foros', label: 'Mis foros', icon: MessageSquare, desc: 'Foros en los que participas' },
  { id: 'galeria', label: 'Galería', icon: ImageIcon, desc: 'Imágenes que has subido' },
  { id: 'modo', label: 'Apariencia', icon: Moon, desc: 'Modo claro u oscuro' },
  { id: 'planes', label: 'Planes', icon: CreditCard, desc: 'Beneficios y cómo pagar' },
]

export default function AjustesPage() {
  const { user, profile, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(searchParams.get('tab') as Tab || null)
  const [myForums, setMyForums] = useState<Forum[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading])

  useEffect(() => {
    if (!profile) return
    if (activeTab === 'foros') {
      supabase.from('forum_members').select('forum:forums(*)').eq('user_id', profile.id)
        .then(({ data }) => setMyForums((data || []).map((d: any) => d.forum).filter(Boolean)))
    }
    if (activeTab === 'galeria') {
      supabase.from('gallery').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
        .then(({ data }) => setGallery(data || []))
    }
  }, [activeTab, profile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading || !profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
      <Loader2 size={28} className="animate-spin" color="var(--color-primary)" />
    </div>
  )

  return (
    <div className="app-body" style={{ maxWidth: '680px', margin: '0 auto', display: 'block' }}>
      <div style={{ padding: '0 0 80px' }}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          {activeTab && (
            <button onClick={() => setActiveTab(null)} style={{
              border: 'none', background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-full)', padding: '8px',
              cursor: 'pointer', color: 'var(--color-text-muted)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
            {activeTab ? menuItems.find(m => m.id === activeTab)?.label : 'Ajustes'}
          </h1>
        </div>

        {/* ── Vista: menú principal ──────────────────────────── */}
        {!activeTab && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Chip de perfil */}
            <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.alias} className="avatar" style={{ width: '56px', height: '56px' }} />
                : <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '22px' }}>
                    {profile.alias[0].toUpperCase()}
                  </div>
              }
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>@{profile.alias}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{profile.email}</div>
                {profile.has_feed_badge && (
                  <span className={profile.plan === 'anon_pro' ? 'badge-pro' : 'badge-basic'} style={{ marginTop: '4px' }}>
                    {siteConfig.plans.find(p => p.id === profile.plan)?.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Menú items */}
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              {menuItems.map((item, i) => (
                <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%', padding: '14px 16px',
                  border: 'none', borderBottom: i < menuItems.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: 'transparent', cursor: 'pointer',
                  textAlign: 'left', transition: 'background var(--transition)',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--color-primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={18} color="var(--color-primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.desc}</div>
                  </div>
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </button>
              ))}
            </div>

            {/* Cambiar cuenta */}
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <Link href="/auth/login" style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', textDecoration: 'none', color: 'var(--color-text)',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={18} color="#10B981" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Cambiar de cuenta</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Inicia sesión con otra cuenta</div>
                </div>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </Link>

              {profile.role === 'admin' && (
                <Link href="/admin" style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', textDecoration: 'none', color: 'var(--color-text)',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={18} color="#D97706" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>Panel de Admin</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Gestión de usuarios y contenido</div>
                  </div>
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </Link>
              )}

              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                width: '100%', padding: '14px 16px',
                border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogOut size={18} color="var(--color-error)" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-error)' }}>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Perfil ───────────────────────────────────── */}
        {activeTab === 'perfil' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Edita tu perfil directamente desde{' '}
              <Link href={`/perfil/${profile.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                tu página de perfil
              </Link>
            </p>
          </div>
        )}

        {/* ── Tab: Mis Foros ────────────────────────────────── */}
        {activeTab === 'foros' && (
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {myForums.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <MessageSquare size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
                <p>No perteneces a ningún foro aún</p>
                <Link href="/comunidades" className="btn btn-primary" style={{ marginTop: '12px', fontSize: '13px' }}>
                  Explorar comunidades
                </Link>
              </div>
            ) : (
              myForums.map((forum, i) => (
                <Link key={forum.id} href={`/comunidades/${forum.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', textDecoration: 'none', color: 'var(--color-text)',
                  borderBottom: i < myForums.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {forum.avatar_url ? <img src={forum.avatar_url} alt={forum.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} /> : forum.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{forum.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{forum.member_count} miembros</div>
                  </div>
                  <ChevronRight size={14} color="var(--color-text-muted)" />
                </Link>
              ))
            )}
          </div>
        )}

        {/* ── Tab: Galería ──────────────────────────────────── */}
        {activeTab === 'galeria' && (
          <div>
            {gallery.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <ImageIcon size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
                <p>No has subido imágenes aún</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {gallery.map(img => (
                  <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer"
                    style={{ aspectRatio: '1', display: 'block', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Modo ─────────────────────────────────────── */}
        {activeTab === 'modo' && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Apariencia</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['light', 'dark'] as const).map(t => (
                <button key={t} onClick={() => { if (theme !== t) toggleTheme() }} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${theme === t ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: theme === t ? 'var(--color-primary-muted)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  {t === 'light' ? <Sun size={20} color={theme === t ? 'var(--color-primary)' : 'var(--color-text-muted)'} /> : <Moon size={20} color={theme === t ? 'var(--color-primary)' : 'var(--color-text-muted)'} />}
                  <span style={{ fontWeight: 600, color: theme === t ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    {t === 'light' ? '☀️ Modo claro' : '🌙 Modo oscuro'}
                  </span>
                  {theme === t && <Check size={16} color="var(--color-primary)" style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Planes ───────────────────────────────────── */}
        {activeTab === 'planes' && <PlanesTab profile={profile} />}
      </div>
    </div>
  )
}

// ── Planes Tab ────────────────────────────────────────────────
function PlanesTab({ profile }: { profile: any }) {
  const currentPlan = siteConfig.plans.find(p => p.id === profile.plan)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Plan actual */}
      <div className="card" style={{ padding: '16px', border: '2px solid var(--color-primary)' }}>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tu plan actual</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>{currentPlan?.badge || '📦'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px' }}>{currentPlan?.name}</div>
            {profile.plan_expires_at && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Vence: {new Date(profile.plan_expires_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planes disponibles */}
      {siteConfig.plans.filter(p => p.id !== 'free').map(plan => (
        <div key={plan.id} className="card" style={{
          padding: '20px',
          border: profile.plan === plan.id ? `2px solid ${plan.color}` : '1.5px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{plan.badge}</span>
                <span style={{ fontWeight: 800, fontSize: '18px' }}>{plan.name}</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{plan.description}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: plan.color }}>
                {plan.currency} {plan.price}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>/{plan.period}</div>
            </div>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {plan.features.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)' }}>
                <Check size={14} color="var(--color-success)" /> {f}
              </li>
            ))}
          </ul>

          {profile.plan !== plan.id && (
            <a
              href={`mailto:${siteConfig.supportEmail}?subject=Solicitud Plan ${plan.name}&body=${siteConfig.emailTemplates.planRequest(plan.name, profile.email)}`}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', background: plan.color }}
            >
              <Mail size={15} /> Solicitar plan por correo
            </a>
          )}
          {profile.plan === plan.id && (
            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--color-success)' }}>
              <Check size={15} style={{ display: 'inline', marginRight: '4px' }} /> Plan activo
            </div>
          )}
        </div>
      ))}

      {/* Cómo pagar */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>💳 Cómo pagar</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-hover)' }}>
            <Phone size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: 600 }}>Yape / Plin</div>
              <div style={{ color: 'var(--color-text-muted)' }}>{siteConfig.payment.yapeNumber} — {siteConfig.payment.yapeAlias}</div>
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-hover)', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            {siteConfig.payment.instructions}
          </div>
        </div>
      </div>

      {/* Soporte */}
      <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          ¿Tienes dudas o problemas con tu plan?
        </p>
        <a
          href={`mailto:${siteConfig.supportEmail}?body=${siteConfig.emailTemplates.support()}`}
          className="btn btn-ghost"
          style={{ fontSize: '13px' }}
        >
          <Mail size={15} /> Escribir a soporte
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
