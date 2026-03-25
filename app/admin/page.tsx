'use client'

// ============================================================
//  app/admin/page.tsx
//  Panel de administración completo
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import siteConfig from '@/site.config'
import type { Profile, WhitelistEntry, Forum, PlanRequest } from '@/lib/types'
import {
  Users, Shield, List, MessageSquare, CreditCard,
  Settings, Plus, Trash2, Search, Check, X, Loader2,
  ToggleLeft, ToggleRight, Eye, EyeOff, ChevronDown, UserCheck
} from 'lucide-react'

type AdminTab = 'usuarios' | 'whitelist' | 'foros' | 'planes' | 'config'

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('usuarios')

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') router.push('/')
  }, [profile, loading])

  if (loading || !profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
      <Loader2 size={28} className="animate-spin" color="var(--color-primary)" />
    </div>
  )

  if (profile.role !== 'admin') return null

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'whitelist', label: 'Whitelist', icon: List },
    { id: 'foros', label: 'Foros', icon: MessageSquare },
    { id: 'planes', label: 'Planes', icon: CreditCard },
    { id: 'config', label: 'Config', icon: Settings },
  ]

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Shield size={20} color="#D97706" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Panel de Admin</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>{siteConfig.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as AdminTab)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: 'var(--radius-full)',
            border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            background: tab === t.id ? 'var(--color-primary)' : 'var(--color-bg-card)',
            color: tab === t.id ? 'white' : 'var(--color-text-muted)',
            whiteSpace: 'nowrap', transition: 'all var(--transition)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'usuarios' && <UsersTab />}
      {tab === 'whitelist' && <WhitelistTab />}
      {tab === 'foros' && <ForosTab />}
      {tab === 'planes' && <PlanesAdminTab />}
      {tab === 'config' && <ConfigTab />}
    </div>
  )
}

// ── Tab: Usuarios ─────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }, [])

  const filtered = users.filter(u =>
    u.alias.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const updateUser = async (id: string, updates: Partial<Profile>) => {
    await supabase.from('profiles').update(updates).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }

  const toggleBan = async (user: Profile) => {
    await updateUser(user.id, { is_banned: !user.is_banned, is_active: user.is_banned })
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: !user.is_banned, is_active: user.is_banned } : u))
  }

  const setRole = async (id: string, role: 'user' | 'manager' | 'admin') => {
    await updateUser(id, { role })
  }

  const setPlan = async (id: string, plan: 'free' | 'anon_basic' | 'anon_pro') => {
    const expiresAt = plan !== 'free'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null
    await updateUser(id, { plan, plan_expires_at: expiresAt })

    // Notificar al usuario
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'plan_activated',
      title: plan === 'free' ? 'Plan actualizado' : `¡Plan ${siteConfig.plans.find(p => p.id === plan)?.name} activado!`,
      body: plan === 'free'
        ? 'Tu plan ha sido cambiado al plan gratuito.'
        : `Tu plan ha sido activado por 30 días. ¡Disfruta tus beneficios!`,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input className="input" placeholder="Buscar por alias, correo o nombre..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
      </div>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {filtered.length} usuarios
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="animate-spin" color="var(--color-primary)" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-hover)' }}>
                  {['Usuario', 'Correo', 'Nombre real', 'Rol', 'Plan', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <tr key={user.id} style={{ borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: user.avatar_url ? 'transparent' : 'var(--color-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '12px', overflow: 'hidden', flexShrink: 0,
                        }}>
                          {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.alias[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>@{user.alias}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: '13px' }}>{user.email}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px' }}>{user.full_name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <select value={user.role} onChange={e => setRole(user.id, e.target.value as any)} style={{
                        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                        fontSize: '12px', cursor: 'pointer', color: 'var(--color-text)',
                      }}>
                        <option value="user">Usuario</option>
                        <option value="manager">Encargado</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <select value={user.plan} onChange={e => setPlan(user.id, e.target.value as any)} style={{
                        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)', background: 'var(--color-bg-input)',
                        fontSize: '12px', cursor: 'pointer', color: 'var(--color-text)',
                      }}>
                        {siteConfig.plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: user.is_banned ? '#FEE2E2' : user.is_active ? '#D1FAE5' : '#FEF3C7',
                        color: user.is_banned ? 'var(--color-error)' : user.is_active ? 'var(--color-success)' : '#D97706',
                        fontWeight: 600,
                      }}>
                        {user.is_banned ? 'Bloqueado' : user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => toggleBan(user)} style={{
                        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${user.is_banned ? 'var(--color-success)' : 'var(--color-error)'}`,
                        background: 'transparent', cursor: 'pointer', fontSize: '12px',
                        color: user.is_banned ? 'var(--color-success)' : 'var(--color-error)',
                      }}>
                        {user.is_banned ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Whitelist ────────────────────────────────────────────
function WhitelistTab() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [whitelistEnabled, setWhitelistEnabled] = useState(true)
  const supabase = createClient()
  const { profile } = useAuth()

  useEffect(() => {
    Promise.all([
      supabase.from('whitelist').select('*').order('created_at', { ascending: false }),
      supabase.from('site_settings').select('value').eq('key', 'whitelist_enabled').single(),
    ]).then(([{ data: entries }, { data: setting }]) => {
      setEntries(entries || [])
      setWhitelistEnabled(setting?.value === true)
      setLoading(false)
    })
  }, [])

  const toggleWhitelist = async () => {
    const next = !whitelistEnabled
    await supabase.from('site_settings').update({ value: next, updated_by: profile?.id }).eq('key', 'whitelist_enabled')
    setWhitelistEnabled(next)
  }

  const addEmail = async () => {
    if (!newEmail.trim()) return
    setAdding(true)
    const { data, error } = await supabase.from('whitelist').insert({
      email: newEmail.trim().toLowerCase(),
      added_by: profile?.id,
    }).select().single()
    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setNewEmail('')
    }
    setAdding(false)
  }

  const removeEmail = async (id: string) => {
    await supabase.from('whitelist').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const handleBulkPaste = async (text: string) => {
    const emails = text.split(/[\n,;]/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'))
    for (const email of emails) {
      const { data } = await supabase.from('whitelist').insert({ email, added_by: profile?.id }).select().single()
      if (data) setEntries(prev => [data, ...prev])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toggle whitelist */}
      <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>Lista blanca de correos</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {whitelistEnabled ? 'Activa: solo correos de la lista pueden registrarse' : 'Desactivada: cualquier correo puede registrarse'}
          </div>
        </div>
        <button onClick={toggleWhitelist} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
          {whitelistEnabled
            ? <ToggleRight size={36} color="var(--color-primary)" />
            : <ToggleLeft size={36} color="var(--color-text-muted)" />
          }
        </button>
      </div>

      {/* Agregar correo */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>Agregar correo</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="input" type="email" placeholder="correo@ejemplo.com"
            value={newEmail} onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEmail()}
            style={{ flex: 1 }} />
          <button onClick={addEmail} disabled={adding || !newEmail.trim()} className="btn btn-primary" style={{ padding: '9px 16px' }}>
            {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          </button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
            O pega una lista (separados por coma, punto y coma o saltos de línea):
          </label>
          <textarea className="input textarea" rows={3} placeholder="correo1@ej.com, correo2@ej.com..."
            onBlur={e => { if (e.target.value) { handleBulkPaste(e.target.value); e.target.value = '' } }} />
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {entries.length} correos en la lista
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center' }}><Loader2 size={20} className="animate-spin" /></div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>Lista vacía</div>
        ) : (
          entries.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 16px',
              borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
            }}>
              <Mail size={14} color="var(--color-text-muted)" />
              <span style={{ flex: 1, fontSize: '14px' }}>{e.email}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
                {new Date(e.created_at).toLocaleDateString('es-PE')}
              </span>
              <button onClick={() => removeEmail(e.id)} style={{
                border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-error)',
                padding: '4px',
              }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Tab: Foros ────────────────────────────────────────────────
function ForosTab() {
  const [forums, setForums] = useState<Forum[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('forums').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setForums(data || []); setLoading(false) })
  }, [])

  const toggleForum = async (id: string, current: boolean) => {
    await supabase.from('forums').update({ is_active: !current }).eq('id', id)
    setForums(prev => prev.map(f => f.id === id ? { ...f, is_active: !current } : f))
  }

  const deleteForum = async (id: string) => {
    if (!confirm('¿Eliminar este foro y todo su contenido?')) return
    await supabase.from('forums').delete().eq('id', id)
    setForums(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
        {forums.length} foros
      </div>
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="animate-spin" /></div>
      ) : forums.map((forum, i) => (
        <div key={forum.id} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'var(--color-primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
          }}>
            {forum.type === 'anonymous' ? '👤' : forum.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{forum.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {forum.type} · {forum.member_count} miembros
              {forum.is_default && ' · Predeterminado'}
            </div>
          </div>
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: forum.is_active ? '#D1FAE5' : '#FEE2E2',
            color: forum.is_active ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600,
          }}>
            {forum.is_active ? 'Activo' : 'Inactivo'}
          </span>
          <button onClick={() => toggleForum(forum.id, forum.is_active)} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--color-text-muted)', padding: '4px',
          }}>
            {forum.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {!forum.is_default && (
            <button onClick={() => deleteForum(forum.id)} style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--color-error)', padding: '4px',
            }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tab: Planes (solicitudes) ─────────────────────────────────
function PlanesAdminTab() {
  const [requests, setRequests] = useState<PlanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { profile } = useAuth()

  useEffect(() => {
    supabase.from('plan_requests')
      .select('*, user:profiles(id, alias, email, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRequests((data as any) || []); setLoading(false) })
  }, [])

  const handleRequest = async (id: string, userId: string, planId: string, status: 'approved' | 'rejected') => {
    await supabase.from('plan_requests').update({
      status, reviewed_by: profile?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    if (status === 'approved') {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await supabase.from('profiles').update({ plan: planId, plan_expires_at: expiresAt }).eq('id', userId)
      await supabase.from('notifications').insert({
        user_id: userId, type: 'plan_activated',
        title: '¡Plan activado!',
        body: `Tu solicitud de plan fue aprobada. ¡Disfruta tus beneficios por 30 días!`,
      })
    } else {
      await supabase.from('notifications').insert({
        user_id: userId, type: 'system',
        title: 'Solicitud de plan revisada',
        body: 'Tu solicitud de plan fue revisada. Si tienes dudas, escribe al soporte.',
      })
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const pending = requests.filter(r => r.status === 'pending')
  const reviewed = requests.filter(r => r.status !== 'pending')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: '15px' }}>
          Solicitudes pendientes ({pending.length})
        </div>
        {loading ? <div style={{ padding: '30px', textAlign: 'center' }}><Loader2 size={20} className="animate-spin" /></div>
          : pending.length === 0 ? <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sin solicitudes pendientes</div>
          : pending.map((req, i) => (
            <RequestRow key={req.id} request={req} onAction={handleRequest} showActions />
          ))
        }
      </div>
      {reviewed.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: '15px' }}>
            Historial ({reviewed.length})
          </div>
          {reviewed.slice(0, 10).map((req) => <RequestRow key={req.id} request={req} onAction={handleRequest} />)}
        </div>
      )}
    </div>
  )
}

function RequestRow({ request, onAction, showActions }: { request: any; onAction: any; showActions?: boolean }) {
  const user = request.user
  const planInfo = siteConfig.plans.find(p => p.id === request.plan_id)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
        {user?.alias?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>@{user?.alias}</div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{user?.email} · {planInfo?.name} ({planInfo?.currency} {planInfo?.price})</div>
        {request.note && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>"{request.note}"</div>}
      </div>
      <span style={{
        fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600,
        background: request.status === 'approved' ? '#D1FAE5' : request.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
        color: request.status === 'approved' ? 'var(--color-success)' : request.status === 'rejected' ? 'var(--color-error)' : '#D97706',
      }}>
        {request.status === 'approved' ? 'Aprobado' : request.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
      </span>
      {showActions && request.status === 'pending' && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onAction(request.id, request.user_id, request.plan_id, 'approved')} style={{ padding: '5px', border: 'none', background: '#D1FAE5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--color-success)' }}><Check size={15} /></button>
          <button onClick={() => onAction(request.id, request.user_id, request.plan_id, 'rejected')} style={{ padding: '5px', border: 'none', background: '#FEE2E2', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--color-error)' }}><X size={15} /></button>
        </div>
      )}
    </div>
  )
}

// ── Tab: Config ───────────────────────────────────────────────
function ConfigTab() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { profile } = useAuth()

  useEffect(() => {
    supabase.from('site_settings').select('*')
      .then(({ data }) => {
        const map: Record<string, any> = {}
        ;(data || []).forEach(s => { map[s.key] = s.value })
        setSettings(map)
        setLoading(false)
      })
  }, [])

  const updateSetting = async (key: string, value: any) => {
    await supabase.from('site_settings').update({ value, updated_by: profile?.id }).eq('key', key)
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const configItems = [
    { key: 'whitelist_enabled', label: 'Lista blanca activa', desc: 'Solo correos autorizados pueden registrarse', type: 'bool' },
    { key: 'allow_registrations', label: 'Registros abiertos', desc: 'Permite nuevos registros en la plataforma', type: 'bool' },
    { key: 'maintenance_mode', label: 'Modo mantenimiento', desc: 'Muestra aviso de mantenimiento a los usuarios', type: 'bool' },
    { key: 'featured_posts_limit', label: 'Publicaciones destacadas máximas', desc: 'Cantidad máxima en el feed', type: 'number' },
  ]

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: '15px' }}>Configuración del sitio</div>
      {loading ? <div style={{ padding: '30px', textAlign: 'center' }}><Loader2 size={20} className="animate-spin" /></div>
        : configItems.map((item, i) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.desc}</div>
            </div>
            {item.type === 'bool' ? (
              <button onClick={() => updateSetting(item.key, !settings[item.key])} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                {settings[item.key]
                  ? <ToggleRight size={32} color="var(--color-primary)" />
                  : <ToggleLeft size={32} color="var(--color-text-muted)" />
                }
              </button>
            ) : (
              <input type="number" className="input" value={settings[item.key] || 0}
                onChange={e => updateSetting(item.key, parseInt(e.target.value))}
                style={{ width: '80px', textAlign: 'center' }} />
            )}
          </div>
        ))
      }
    </div>
  )
}

// Importar Mail en el archivo de la whitelist
import { Mail } from 'lucide-react'
