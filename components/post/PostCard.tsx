'use client'

// ============================================================
//  components/posts/PostCard.tsx
//  Tarjeta de publicación con likes, comentarios e imágenes
// ============================================================

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import CommentSection from './CommentSection'
import type { PostWithAuthor, Profile } from '@/lib/types'
import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  Trash2, Pin, Star, EyeOff, Download
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface PostCardProps {
  post: PostWithAuthor
  currentProfile: Profile | null
  onDelete?: (id: string) => void
}

export default function PostCard({ post, currentProfile, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.user_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const supabase = createClient()

  const isAuthor = currentProfile?.id === post.author_id
  const isAdmin = currentProfile?.role === 'admin'
  const isManager = currentProfile?.role === 'manager' || isAdmin
  const canDelete = isAuthor || isManager

  // ── Like ─────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!currentProfile) return

    const prev = liked
    setLiked(!prev)
    setLikesCount(c => prev ? c - 1 : c + 1)

    if (prev) {
      await supabase.from('likes').delete()
        .eq('user_id', currentProfile.id).eq('post_id', post.id)
    } else {
      await supabase.from('likes').insert({ user_id: currentProfile.id, post_id: post.id })
    }
  }, [liked, currentProfile, post.id])

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta publicación?')) return
    await supabase.from('posts').delete().eq('id', post.id)
    onDelete?.(post.id)
    setShowMenu(false)
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })

  return (
    <article className="card fade-in" style={{ padding: '0', overflow: 'hidden' }}>

      {/* ── Publicación destacada ─────────────────────────── */}
      {post.is_featured && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          background: 'linear-gradient(90deg, var(--color-accent-light), transparent)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-accent)',
        }}>
          <Star size={13} fill="currentColor" />
          Publicación destacada
        </div>
      )}

      <div style={{ padding: '16px' }}>

        {/* ── Header del post ───────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>

          {/* Avatar */}
          {post.is_anonymous ? (
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--color-anon-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>
              👤
            </div>
          ) : post.author_avatar ? (
            <img src={post.author_avatar} alt={post.author_alias || ''} className="avatar"
              style={{ width: '40px', height: '40px', flexShrink: 0 }} />
          ) : (
            <Link href={`/perfil/${post.author_id}`}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '16px', cursor: 'pointer',
              }}>
                {post.author_alias?.[0]?.toUpperCase() || '?'}
              </div>
            </Link>
          )}

          {/* Nombre y tiempo */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {post.is_anonymous ? (
                <span className="anon-chip">
                  <EyeOff size={11} /> Anónimo
                </span>
              ) : (
                <Link href={`/perfil/${post.author_id}`} style={{
                  fontWeight: 700, fontSize: '14px',
                  color: 'var(--color-text)', textDecoration: 'none',
                }}>
                  {post.author_alias}
                </Link>
              )}
              {/* Badge de plan */}
              {!post.is_anonymous && post.author_has_badge && (
                <span className={post.author_plan === 'anon_pro' ? 'badge-pro' : 'badge-basic'}>
                  {post.author_plan === 'anon_pro' ? '🔥 Pro' : '⭐ Basic'}
                </span>
              )}
              {/* Rol */}
              {!post.is_anonymous && post.author_role === 'manager' && (
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary-muted)',
                  color: 'var(--color-primary)',
                }}>Encargado</span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>{timeAgo}</span>
          </div>

          {/* Menú opciones */}
          {(canDelete || isAdmin) && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={{
                padding: '4px', border: 'none', background: 'transparent',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}>
                <MoreHorizontal size={18} />
              </button>
              {showMenu && (
                <div className="card slide-up" style={{
                  position: 'absolute', right: 0, top: '100%', zIndex: 50,
                  minWidth: '150px', padding: '6px',
                }}>
                  {canDelete && (
                    <button onClick={handleDelete} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '8px 10px', border: 'none',
                      background: 'transparent', color: 'var(--color-error)',
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                  {isAdmin && !post.is_pinned && (
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '8px 10px', border: 'none',
                      background: 'transparent', color: 'var(--color-text)',
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                    }}
                      onClick={async () => {
                        await supabase.from('posts').update({ is_pinned: true }).eq('id', post.id)
                        setShowMenu(false)
                      }}>
                      <Pin size={14} /> Fijar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Contenido ─────────────────────────────────────── */}
        <p style={{
          fontSize: '15px',
          color: 'var(--color-text)',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          marginBottom: post.images?.length || post.files?.length ? '12px' : '0',
        }}>
          {post.content}
        </p>

        {/* ── Imágenes ──────────────────────────────────────── */}
        {post.images && post.images.length > 0 && (
          <div style={{ marginBottom: '12px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {post.images.length === 1 ? (
              <img src={post.images[0]} alt="Imagen del post"
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <div>
                <img src={post.images[imgIndex]} alt="Imagen del post"
                  style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  {post.images.map((img, i) => (
                    <button key={i} onClick={() => setImgIndex(i)} style={{
                      width: '56px', height: '40px', border: i === imgIndex ? '2px solid var(--color-primary)' : '2px solid transparent',
                      borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer', padding: 0,
                    }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Archivos ──────────────────────────────────────── */}
        {post.files && post.files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {post.files.map((file, i) => (
              <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)',
                textDecoration: 'none', color: 'var(--color-text)',
                fontSize: '13px', fontWeight: 500,
              }}>
                <Download size={16} color="var(--color-primary)" />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {file.size ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Acciones ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 16px',
        borderTop: '1px solid var(--color-border)',
      }}>
        {/* Like */}
        <ActionButton
          icon={<Heart size={18} fill={liked ? 'var(--color-error)' : 'none'} color={liked ? 'var(--color-error)' : 'var(--color-text-muted)'} />}
          label={likesCount > 0 ? likesCount.toString() : 'Me gusta'}
          onClick={handleLike}
          active={liked}
          disabled={!currentProfile}
        />

        {/* Comentarios */}
        <ActionButton
          icon={<MessageCircle size={18} color={showComments ? 'var(--color-primary)' : 'var(--color-text-muted)'} />}
          label={post.comments_count > 0 ? post.comments_count.toString() : 'Comentar'}
          onClick={() => setShowComments(!showComments)}
          active={showComments}
        />

        {/* Compartir */}
        <ActionButton
          icon={<Share2 size={18} color="var(--color-text-muted)" />}
          label="Compartir"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.origin + `/post/${post.id}`)
          }}
        />
      </div>

      {/* ── Sección de comentarios ────────────────────────────── */}
      {showComments && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          <CommentSection postId={post.id} currentProfile={currentProfile} isAnonymousSection={post.section === 'forum' && post.is_anonymous} />
        </div>
      )}
    </article>
  )
}

// ── Action Button ─────────────────────────────────────────────
function ActionButton({
  icon, label, onClick, active, disabled
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 12px',
        border: 'none',
        background: active ? 'var(--color-primary-muted)' : 'transparent',
        borderRadius: 'var(--radius-full)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
        transition: 'all var(--transition)',
        opacity: disabled ? 0.5 : 1,
        flex: 1,
        justifyContent: 'center',
      }}
    >
      {icon}
      <span style={{ display: 'none' }} className="sm-show">{label}</span>
      <span style={{ fontSize: '12px' }}>
        {/^\d+$/.test(label) ? label : ''}
      </span>
    </button>
  )
}
