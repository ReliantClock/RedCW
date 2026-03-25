'use client'

// ============================================================
//  components/comunidades/ForumPage.tsx
//  Vista interna del foro
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostFeed from '@/components/posts/PostFeed'
import PostCreator from '@/components/posts/PostCreator'
import type { Forum, Profile } from '@/lib/types'
import { EyeOff, Lock, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ForumPageProps {
  forum: Forum & { user_is_member: boolean; user_role: string | null }
  currentProfile: Profile | null
  isMember: boolean
}

export default function ForumPage({ forum, currentProfile, isMember: initialMember }: ForumPageProps) {
  const [isMember, setIsMember] = useState(initialMember)
  const [joining, setJoining] = useState(false)
  const supabase = createClient()

  const isAnon = forum.type === 'anonymous'
  const isPrivate = forum.type === 'private'
  const canPost = currentProfile && (isMember || forum.is_default)
  const isAdmin = currentProfile?.role === 'admin'

  const handleJoin = async () => {
    if (!currentProfile) return
    setJoining(true)
    await supabase.from('forum_members').insert({ forum_id: forum.id, user_id: currentProfile.id })
    setIsMember(true)
    setJoining(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header del foro ───────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {/* Banner */}
        <div style={{
          height: '80px',
          background: isAnon
            ? 'linear-gradient(135deg, #374151, #1F2937)'
            : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          position: 'relative',
        }}>
          <Link href="/comunidades" style={{
            position: 'absolute', top: '12px', left: '12px',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500, textDecoration: 'none',
          }}>
            <ArrowLeft size={15} /> Comunidades
          </Link>
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          {/* Avatar del foro */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: isAnon ? 'var(--color-anon-bg)' : 'var(--color-primary-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', marginTop: '-28px', marginBottom: '10px',
            border: '3px solid var(--color-bg-card)',
            overflow: 'hidden',
          }}>
            {forum.avatar_url
              ? <img src={forum.avatar_url} alt={forum.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : isAnon ? '👤' : forum.name[0].toUpperCase()
            }
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{forum.name}</h1>
                {forum.is_default && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: 'white', fontWeight: 600 }}>
                    Predeterminado
                  </span>
                )}
                {isAnon && (
                  <span className="anon-chip"><EyeOff size={11} /> Anónimo</span>
                )}
                {isPrivate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    <Lock size={11} /> Privado
                  </span>
                )}
              </div>
              {forum.description && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                  {forum.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} /> {forum.member_count} miembros
                </span>
              </div>
            </div>

            {/* Botón unirse */}
            {currentProfile && !isMember && !isPrivate && (
              <button onClick={handleJoin} disabled={joining} className="btn btn-primary"
                style={{ fontSize: '13px', padding: '7px 16px', flexShrink: 0 }}>
                {joining ? 'Uniéndose...' : 'Unirse'}
              </button>
            )}

            {isMember && !forum.is_default && (
              <span style={{
                fontSize: '12px', padding: '5px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-muted)', color: 'var(--color-primary)', fontWeight: 600,
              }}>
                ✓ Miembro
              </span>
            )}
          </div>

          {/* Info anónimo */}
          {isAnon && (
            <div style={{
              marginTop: '12px', padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-anon-bg)',
              fontSize: '13px', color: 'var(--color-anon)',
              display: 'flex', alignItems: 'flex-start', gap: '8px',
            }}>
              <EyeOff size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                Las publicaciones en este foro son anónimas. Tu identidad no será visible para otros usuarios.
                {isAdmin && ' Como administrador, puedes ver las identidades reales.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Foro privado sin membresía ────────────────────── */}
      {isPrivate && !isMember && !isAdmin ? (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Lock size={32} color="var(--color-text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '6px' }}>Foro privado</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Necesitas una invitación para ver el contenido de este foro.
          </p>
        </div>
      ) : (
        <>
          {canPost && (
            <PostCreator
              profile={currentProfile!}
              section="forum"
              forumId={forum.id}
            />
          )}
          <PostFeed section="forum" forumId={forum.id} currentProfile={currentProfile} />
        </>
      )}
    </div>
  )
}
