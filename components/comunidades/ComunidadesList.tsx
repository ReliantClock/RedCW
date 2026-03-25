'use client'

// ============================================================
//  components/comunidades/ComunidadesList.tsx
//  Lista de comunidades estilo WhatsApp + crear foro
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Forum, Profile } from '@/lib/types'
import { Search, Plus, Lock, Eye, EyeOff, Users, MessageSquare, X, Loader2 } from 'lucide-react'

interface ComunidadesListProps {
  forums: (Forum & { user_is_member: boolean; user_role: string | null })[]
  currentProfile: Profile | null
}

export default function ComunidadesList({ forums: initialForums, currentProfile }: ComunidadesListProps) {
  const [forums, setForums] = useState(initialForums)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const supabase = createClient()

  const canCreate = currentProfile && (
    currentProfile.role === 'admin' ||
    currentProfile.can_create_anon_forum ||
    currentProfile.role === 'manager'
  )

  const filtered = forums.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'all' || f.user_is_member
    return matchSearch && matchTab
  })

  const joinForum = async (forumId: string) => {
    if (!currentProfile) return
    await supabase.from('forum_members').insert({ forum_id: forumId, user_id: currentProfile.id })
    setForums(prev => prev.map(f => f.id === forumId ? { ...f, user_is_member: true, user_role: 'member', member_count: f.member_count + 1 } : f))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Comunidades</h2>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '13px' }}>
              <Plus size={15} /> Crear foro
            </button>
          )}
        </div>

        {/* Búsqueda */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="input" placeholder="Buscar comunidades..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'mine'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: tab === t ? 'var(--color-primary)' : 'var(--color-bg-hover)',
              color: tab === t ? 'white' : 'var(--color-text-muted)',
              transition: 'all var(--transition)',
            }}>
              {t === 'all' ? 'Todos' : 'Mis foros'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista de foros (estilo WhatsApp) ──────────────── */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
            <p>No se encontraron comunidades</p>
          </div>
        ) : (
          filtered.map((forum, i) => (
            <ForumRow
              key={forum.id}
              forum={forum}
              isLast={i === filtered.length - 1}
              currentProfile={currentProfile}
              onJoin={() => joinForum(forum.id)}
            />
          ))
        )}
      </div>

      {/* ── Modal crear foro ──────────────────────────────── */}
      {showCreate && currentProfile && (
        <CreateForumModal
          profile={currentProfile}
          onClose={() => setShowCreate(false)}
          onCreated={f => { setForums(prev => [f, ...prev]); setShowCreate(false) }}
        />
      )}
    </div>
  )
}

// ── ForumRow (estilo WhatsApp) ────────────────────────────────
function ForumRow({ forum, isLast, currentProfile, onJoin }: {
  forum: Forum & { user_is_member: boolean; user_role: string | null }
  isLast: boolean
  currentProfile: Profile | null
  onJoin: () => void
}) {
  const isAnon = forum.type === 'anonymous'
  const isPrivate = forum.type === 'private'
  const isDefault = forum.is_default

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
      <Link href={`/comunidades/${forum.id}`} style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', textDecoration: 'none', color: 'var(--color-text)',
        transition: 'background var(--transition)',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Icono/Avatar del foro */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
          background: isAnon ? 'var(--color-anon-bg)' : 'var(--color-primary-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', overflow: 'hidden',
          border: isDefault ? '2px solid var(--color-primary)' : 'none',
        }}>
          {forum.avatar_url
            ? <img src={forum.avatar_url} alt={forum.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : isAnon ? '👤' : forum.name[0].toUpperCase()
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {forum.name}
            </span>
            {isDefault && (
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: 'white', fontWeight: 600 }}>
                Default
              </span>
            )}
            {isAnon && !isDefault && (
              <span style={{ fontSize: '10px', color: 'var(--color-anon)' }}>
                <EyeOff size={11} />
              </span>
            )}
            {isPrivate && (
              <Lock size={12} color="var(--color-text-muted)" />
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {forum.description || 'Sin descripción'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Users size={10} /> {forum.member_count}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MessageSquare size={10} /> {forum.post_count}
            </span>
          </div>
        </div>

        {/* Acción */}
        {currentProfile && !forum.user_is_member && !isPrivate && !isDefault && (
          <button onClick={e => { e.preventDefault(); onJoin() }} className="btn btn-ghost"
            style={{ fontSize: '12px', padding: '5px 12px', flexShrink: 0 }}>
            Unirse
          </button>
        )}
        {forum.user_is_member && (
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--color-primary)', flexShrink: 0,
          }} />
        )}
      </Link>
    </div>
  )
}

// ── Modal Crear Foro ──────────────────────────────────────────
function CreateForumModal({ profile, onClose, onCreated }: {
  profile: Profile; onClose: () => void; onCreated: (f: Forum) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'public' | 'private' | 'anonymous'>('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const canCreateAnon = profile.can_create_anon_forum || profile.role === 'admin'

  // Contar foros anónimos actuales del usuario
  const handleCreate = async () => {
    if (!name.trim()) return setError('El nombre es obligatorio')
    setLoading(true)
    setError('')

    try {
      if (type === 'anonymous') {
        const { count } = await supabase
          .from('forums')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', profile.id)
          .eq('type', 'anonymous')
          .eq('is_default', false)

        if ((count || 0) >= profile.max_anon_forums) {
          setError(`Tu plan permite máximo ${profile.max_anon_forums} foro(s) anónimo(s).`)
          setLoading(false)
          return
        }
      }

      const { data, error: err } = await supabase.from('forums').insert({
        name: name.trim(), description: description.trim() || null,
        type, created_by: profile.id,
      }).select().single()

      if (err) throw err

      // Unirse como owner
      await supabase.from('forum_members').insert({ forum_id: data.id, user_id: profile.id, role: 'owner' })
      onCreated({ ...data, user_is_member: true, user_role: 'owner' } as any)
    } catch (e: any) {
      setError(e.message || 'Error al crear el foro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card slide-up" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Crear comunidad</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nombre *</label>
            <input className="input" placeholder="Nombre de la comunidad" value={name} onChange={e => setName(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Descripción</label>
            <textarea className="input textarea" placeholder="¿De qué trata esta comunidad?" value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={200} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Tipo de foro</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <TypeOption icon={<Eye size={15} />} label="Público" desc="Cualquiera puede unirse y ver" value="public" selected={type === 'public'} onClick={() => setType('public')} />
              <TypeOption icon={<Lock size={15} />} label="Privado" desc="Solo con invitación o aprobación" value="private" selected={type === 'private'} onClick={() => setType('private')} />
              {canCreateAnon && (
                <TypeOption icon={<EyeOff size={15} />} label="Anónimo" desc="Las publicaciones no muestran identidad" value="anonymous" selected={type === 'anonymous'} onClick={() => setType('anonymous')} badge={`Max ${profile.max_anon_forums}`} />
              )}
            </div>
          </div>

          {error && <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: '#FEE2E2', color: 'var(--color-error)', fontSize: '13px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            <button onClick={handleCreate} disabled={loading || !name.trim()} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypeOption({ icon, label, desc, value, selected, onClick, badge }: any) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', borderRadius: 'var(--radius-md)',
      border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
      background: selected ? 'var(--color-primary-muted)' : 'transparent',
      cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)', width: '100%',
    }}>
      <span style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{desc}</div>
      </div>
      {badge && <span className="badge-basic">{badge}</span>}
      {selected && <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px' }}>✓</div>}
    </button>
  )
}
