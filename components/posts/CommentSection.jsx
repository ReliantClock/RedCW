'use client'

// ============================================================
//  components/posts/CommentSection.tsx
//  Comentarios con respuestas anidadas, likes y realtime
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Comment, Profile } from '@/lib/types'
import { Heart, EyeOff, Trash2, CornerDownRight, Loader2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface CommentSectionProps {
  postId: string
  currentProfile: Profile | null
  isAnonymousSection?: boolean
}

export default function CommentSection({ postId, currentProfile, isAnonymousSection }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; alias: string } | null>(null)
  const supabase = createClient()

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select(`*, author:profiles(id, alias, avatar_url, role, plan, has_feed_badge)`)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    if (!data) return setLoading(false)

    // Traer respuestas
    const withReplies = await Promise.all(data.map(async c => {
      const { data: replies } = await supabase
        .from('comments')
        .select(`*, author:profiles(id, alias, avatar_url, role, plan, has_feed_badge)`)
        .eq('parent_id', c.id)
        .order('created_at', { ascending: true })
      return { ...c, replies: replies || [] }
    }))

    // Likes del usuario actual
    if (currentProfile) {
      const allIds = withReplies.flatMap(c => [c.id, ...(c.replies || []).map((r: Comment) => r.id)])
      const { data: likes } = await supabase
        .from('likes').select('comment_id')
        .eq('user_id', currentProfile.id).in('comment_id', allIds)
      const likedSet = new Set((likes || []).map(l => l.comment_id))
      setComments(withReplies.map(c => ({
        ...c,
        user_liked: likedSet.has(c.id),
        replies: (c.replies || []).map((r: Comment) => ({ ...r, user_liked: likedSet.has(r.id) })),
      })))
    } else {
      setComments(withReplies)
    }
    setLoading(false)
  }, [postId, currentProfile])

  useEffect(() => {
    fetchComments()
    const channel = supabase.channel(`comments-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, fetchComments)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [postId, fetchComments])

  const handleSend = async () => {
    if (!text.trim() || !currentProfile) return
    setSending(true)
    await supabase.from('comments').insert({
      post_id: postId,
      author_id: currentProfile.id,
      content: text.trim(),
      parent_id: replyTo?.id || null,
      is_anonymous: false,
    })
    setText('')
    setReplyTo(null)
    setSending(false)
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('¿Eliminar comentario?')) return
    await supabase.from('comments').delete().eq('id', commentId)
  }

  if (loading) return (
    <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
      <Loader2 size={18} className="animate-spin" color="var(--color-text-muted)" />
    </div>
  )

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Input de nuevo comentario */}
      {currentProfile && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <AvatarSmall profile={currentProfile} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {replyTo && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: 'var(--color-primary)',
              }}>
                <CornerDownRight size={12} />
                Respondiendo a @{replyTo.alias}
                <button onClick={() => setReplyTo(null)} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: 'var(--color-text-muted)', fontSize: '12px', marginLeft: 'auto',
                }}>✕</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                placeholder="Escribe un comentario..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                maxLength={1000}
                style={{ flex: 1, padding: '8px 12px' }}
              />
              <button onClick={handleSend} disabled={sending || !text.trim()} className="btn btn-primary"
                style={{ padding: '8px 14px' }}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de comentarios */}
      {comments.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', padding: '8px 0' }}>
          Sin comentarios aún. ¡Sé el primero!
        </p>
      ) : (
        comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentProfile={currentProfile}
            onReply={a => setReplyTo(a)}
            onDelete={handleDelete}
            isAnonymousSection={isAnonymousSection}
          />
        ))
      )}
    </div>
  )
}

// ── CommentItem ───────────────────────────────────────────────
function CommentItem({
  comment, currentProfile, onReply, onDelete, isAnonymousSection, isReply = false
}: {
  comment: Comment
  currentProfile: Profile | null
  onReply: (a: { id: string; alias: string }) => void
  onDelete: (id: string) => void
  isAnonymousSection?: boolean
  isReply?: boolean
}) {
  const [liked, setLiked] = useState(comment.user_liked || false)
  const [likesCount, setLikesCount] = useState(comment.likes_count)
  const supabase = createClient()

  const canDelete = currentProfile && (
    currentProfile.id === comment.author_id ||
    currentProfile.role === 'admin' ||
    currentProfile.role === 'manager'
  )

  const handleLike = async () => {
    if (!currentProfile) return
    const prev = liked
    setLiked(!prev)
    setLikesCount(c => prev ? c - 1 : c + 1)
    if (prev) {
      await supabase.from('likes').delete().eq('user_id', currentProfile.id).eq('comment_id', comment.id)
    } else {
      await supabase.from('likes').insert({ user_id: currentProfile.id, comment_id: comment.id })
    }
  }

  const alias = comment.is_anonymous
    ? (isAnonymousSection && currentProfile?.role === 'admin' ? `[${(comment.author as any)?.alias || 'Anónimo'}]` : 'Anónimo')
    : (comment.author as any)?.alias || 'Usuario'

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })

  return (
    <div style={{ display: 'flex', gap: '8px', marginLeft: isReply ? '32px' : '0' }}>
      {comment.is_anonymous ? (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--color-anon-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
        }}>👤</div>
      ) : (
        <AvatarSmall profile={comment.author as any} size={32} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: 'var(--color-bg-hover)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {comment.is_anonymous ? (
              <span className="anon-chip" style={{ fontSize: '12px' }}>
                <EyeOff size={10} /> {alias}
              </span>
            ) : (
              <Link href={`/perfil/${comment.author_id}`} style={{
                fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textDecoration: 'none',
              }}>
                {alias}
              </Link>
            )}
            {!comment.is_anonymous && (comment.author as any)?.has_feed_badge && (
              <span className={(comment.author as any)?.plan === 'anon_pro' ? 'badge-pro' : 'badge-basic'} style={{ fontSize: '10px' }}>
                {(comment.author as any)?.plan === 'anon_pro' ? '🔥' : '⭐'}
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--color-text-light)', marginLeft: 'auto' }}>
              {timeAgo}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-text)', wordBreak: 'break-word', lineHeight: '1.5' }}>
            {comment.content}
          </p>
        </div>

        {/* Acciones del comentario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', marginTop: '4px' }}>
          <button onClick={handleLike} disabled={!currentProfile} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            border: 'none', background: 'transparent', cursor: currentProfile ? 'pointer' : 'default',
            fontSize: '12px', fontWeight: 600,
            color: liked ? 'var(--color-error)' : 'var(--color-text-muted)',
          }}>
            <Heart size={13} fill={liked ? 'var(--color-error)' : 'none'} />
            {likesCount > 0 ? likesCount : 'Me gusta'}
          </button>

          {currentProfile && !isReply && (
            <button onClick={() => onReply({ id: comment.id, alias })} style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)',
            }}>
              Responder
            </button>
          )}

          {canDelete && (
            <button onClick={() => onDelete(comment.id)} style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '12px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              <Trash2 size={11} /> Eliminar
            </button>
          )}
        </div>

        {/* Respuestas anidadas */}
        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(comment.replies as Comment[]).map(reply => (
              <CommentItem key={reply.id} comment={reply} currentProfile={currentProfile}
                onReply={onReply} onDelete={onDelete} isAnonymousSection={isAnonymousSection} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Avatar pequeño ────────────────────────────────────────────
function AvatarSmall({ profile, size = 32 }: { profile: any; size?: number }) {
  if (!profile) return null
  return profile.avatar_url ? (
    <img src={profile.avatar_url} alt={profile.alias} className="avatar"
      style={{ width: size, height: size, flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-primary)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.4,
    }}>
      {profile.alias?.[0]?.toUpperCase() || '?'}
    </div>
  )
}
