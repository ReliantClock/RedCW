'use client'

// ============================================================
//  components/perfil/ProfileView.tsx
//  Perfil completo - header con banner, avatar, bio y posts
// ============================================================

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import PostCard from '@/components/posts/PostCard'
import type { Profile, PostWithAuthor } from '@/lib/types'
import { Camera, Edit2, Save, X, Shield, Star, FileText } from 'lucide-react'
import siteConfig from '@/site.config'

interface ProfileViewProps {
  profile: Profile
  currentProfile: Profile | null
  posts: PostWithAuthor[]
  postCount: number
  isOwn: boolean
}

export default function ProfileView({ profile: initialProfile, currentProfile, posts: initialPosts, postCount, isOwn }: ProfileViewProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [posts, setPosts] = useState(initialPosts)
  const [editing, setEditing] = useState(false)
  const [alias, setAlias] = useState(profile.alias)
  const [bio, setBio] = useState(profile.bio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const { refreshProfile } = useAuth()
  const supabase = createClient()

  const planInfo = siteConfig.plans.find(p => p.id === profile.plan)

  const uploadImage = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return publicUrl
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !isOwn) return
    try {
      const url = await uploadImage(file, 'avatars', `${profile.id}/avatar.${file.name.split('.').pop()}`)
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
      setProfile(p => ({ ...p, avatar_url: url }))
      await refreshProfile()
    } catch {}
    e.target.value = ''
  }

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !isOwn) return
    try {
      const url = await uploadImage(file, 'banners', `${profile.id}/banner.${file.name.split('.').pop()}`)
      await supabase.from('profiles').update({ banner_url: url }).eq('id', profile.id)
      setProfile(p => ({ ...p, banner_url: url }))
    } catch {}
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!alias.trim()) return setError('El alias no puede estar vacío')
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ alias: alias.trim(), bio: bio.trim() || null })
      .eq('id', profile.id)
    if (err) {
      setError(err.message.includes('unique') ? 'Ese alias ya está en uso' : err.message)
      setSaving(false)
      return
    }
    setProfile(p => ({ ...p, alias: alias.trim(), bio: bio.trim() || null }))
    await refreshProfile()
    setEditing(false)
    setSaving(false)
  }

  const handleDeletePost = (id: string) => setPosts(prev => prev.filter(p => p.id !== id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header del perfil ─────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {/* Banner */}
        <div style={{
          height: '140px', position: 'relative',
          background: profile.banner_url
            ? `url(${profile.banner_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        }}>
          {isOwn && (
            <>
              <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
              <button onClick={() => bannerRef.current?.click()} style={{
                position: 'absolute', bottom: '10px', right: '10px',
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: 'var(--radius-full)',
                background: 'rgba(0,0,0,0.5)', border: 'none',
                color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>
                <Camera size={13} /> Cambiar portada
              </button>
            </>
          )}
        </div>

        {/* Info del perfil */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', marginTop: '-40px' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.alias} className="avatar"
                  style={{ width: '80px', height: '80px', border: '4px solid var(--color-bg-card)' }} />
              ) : (
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: '30px',
                  border: '4px solid var(--color-bg-card)',
                }}>
                  {profile.alias[0].toUpperCase()}
                </div>
              )}
              {isOwn && (
                <>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  <button onClick={() => avatarRef.current?.click()} style={{
                    position: 'absolute', bottom: '2px', right: '2px',
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'var(--color-primary)', border: '2px solid var(--color-bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white',
                  }}>
                    <Camera size={13} />
                  </button>
                </>
              )}
            </div>

            {/* Botón editar */}
            {isOwn && !editing && (
              <button onClick={() => setEditing(true)} className="btn btn-ghost" style={{ fontSize: '13px', padding: '7px 14px' }}>
                <Edit2 size={14} /> Editar perfil
              </button>
            )}
            {editing && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditing(false); setAlias(profile.alias); setBio(profile.bio || '') }} className="btn btn-ghost" style={{ fontSize: '13px', padding: '7px 12px' }}>
                  <X size={14} />
                </button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ fontSize: '13px', padding: '7px 14px' }}>
                  <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>

          {/* Nombre / alias */}
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Alias público
                </label>
                <input className="input" value={alias} onChange={e => setAlias(e.target.value)} maxLength={30} placeholder="Tu alias" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Bio (máx. 200 caracteres)
                </label>
                <textarea className="input textarea" value={bio} onChange={e => setBio(e.target.value)} maxLength={200} rows={2} placeholder="Cuéntanos algo sobre ti..." />
              </div>
              {error && (
                <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: '#FEE2E2', color: 'var(--color-error)', fontSize: '13px' }}>
                  {error}
                </div>
              )}
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                🔒 El correo y datos reales no se pueden modificar desde aquí.
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>@{profile.alias}</h1>
                {profile.has_feed_badge && (
                  <span className={profile.plan === 'anon_pro' ? 'badge-pro' : 'badge-basic'}>
                    {profile.plan === 'anon_pro' ? '🔥 Pro' : '⭐ Basic'}
                  </span>
                )}
                {profile.role === 'admin' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>
                    <Shield size={11} /> Admin
                  </span>
                )}
                {profile.role === 'manager' && (
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-muted)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    Encargado
                  </span>
                )}
              </div>
              {profile.bio && (
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '6px 0 0', lineHeight: '1.5' }}>
                  {profile.bio}
                </p>
              )}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{postCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Publicaciones</div>
            </div>
            {planInfo && planInfo.id !== 'free' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px' }}>{planInfo.badge}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Plan</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Publicaciones del usuario ──────────────────────── */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontWeight: 700, fontSize: '15px' }}>
          <FileText size={16} color="var(--color-primary)" />
          Publicaciones
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
          <p>Aún no hay publicaciones</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} currentProfile={currentProfile} onDelete={handleDeletePost} />
        ))
      )}
    </div>
  )
}
