'use client'

// ============================================================
//  components/posts/PostFeed.tsx
//  Feed de publicaciones con paginación y actualización realtime
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from './PostCard'
import type { PostWithAuthor, Profile, PostSection } from '@/lib/types'
import { Loader2, RefreshCw } from 'lucide-react'

interface PostFeedProps {
  section: PostSection
  forumId?: string
  groupId?: string
  currentProfile: Profile | null
}

const PAGE_SIZE = 10

export default function PostFeed({ section, forumId, groupId, currentProfile }: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [newPostsAvailable, setNewPostsAvailable] = useState(false)
  const supabase = createClient()

  const fetchPosts = useCallback(async (from = 0, prepend = false) => {
    let query = supabase
      .from('posts_with_author')
      .select('*')
      .eq('section', section)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (forumId) query = query.eq('forum_id', forumId)
    if (groupId) query = query.eq('group_id', groupId)

    const { data, error } = await query

    if (error || !data) return

    // Enriquecer con estado de like del usuario actual
    let enriched: PostWithAuthor[] = data
    if (currentProfile && data.length > 0) {
      const ids = data.map(p => p.id)
      const { data: likes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', currentProfile.id)
        .in('post_id', ids)

      const likedSet = new Set((likes || []).map(l => l.post_id))
      enriched = data.map(p => ({ ...p, user_liked: likedSet.has(p.id) }))
    }

    if (prepend) {
      setPosts(prev => [...enriched, ...prev])
    } else {
      setPosts(prev => from === 0 ? enriched : [...prev, ...enriched])
      setHasMore(data.length === PAGE_SIZE)
    }
  }, [section, forumId, groupId, currentProfile])

  // Carga inicial
  useEffect(() => {
    setLoading(true)
    setNewPostsAvailable(false)
    fetchPosts(0).finally(() => setLoading(false))
  }, [fetchPosts])

  // Realtime: nuevos posts
  useEffect(() => {
    const channel = supabase
      .channel(`posts-feed-${section}-${forumId || ''}-${groupId || ''}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `section=eq.${section}`,
      }, () => {
        setNewPostsAvailable(true)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [section, forumId, groupId])

  const loadMore = async () => {
    setLoadingMore(true)
    await fetchPosts(posts.length)
    setLoadingMore(false)
  }

  const handleRefresh = async () => {
    setNewPostsAvailable(false)
    setLoading(true)
    await fetchPosts(0)
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton" style={{ width: '120px', height: '14px' }} />
                <div className="skeleton" style={{ width: '80px', height: '11px' }} />
              </div>
            </div>
            <div className="skeleton" style={{ width: '100%', height: '60px' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Banner de nuevas publicaciones */}
      {newPostsAvailable && (
        <button onClick={handleRefresh} className="btn btn-primary" style={{
          gap: '8px', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <RefreshCw size={15} />
          Ver nuevas publicaciones
        </button>
      )}

      {posts.length === 0 ? (
        <div className="card" style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>No hay publicaciones aún</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>¡Sé el primero en publicar!</p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentProfile={currentProfile}
              onDelete={handleDelete}
            />
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="btn btn-ghost"
              style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
            >
              {loadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Cargar más'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
