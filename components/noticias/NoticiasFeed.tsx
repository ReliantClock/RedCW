'use client'

// ============================================================
//  components/noticias/NoticiasFeed.tsx
//  Feed de noticias con filtro por grupo y publicación para encargados
// ============================================================

import { useState } from 'react'
import PostFeed from '@/components/posts/PostFeed'
import PostCreator from '@/components/posts/PostCreator'
import type { Profile, Group } from '@/lib/types'
import { Newspaper, ChevronDown, Users, Plus } from 'lucide-react'

interface NoticiasFeedProps {
  groups: (Group & { group_members: { user_id: string; role: string }[] })[]
  currentProfile: Profile | null
}

export default function NoticiasFeed({ groups, currentProfile }: NoticiasFeedProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showGroupPicker, setShowGroupPicker] = useState(false)

  const isAdmin = currentProfile?.role === 'admin'
  const isManager = currentProfile?.role === 'manager' || isAdmin

  // Grupos donde el usuario es manager/owner
  const myGroups = groups.filter(g =>
    isAdmin || g.group_members?.some(m =>
      m.user_id === currentProfile?.id && (m.role === 'manager' || m.role === 'owner')
    )
  )

  const canPost = isManager && (
    !selectedGroup || myGroups.some(g => g.id === selectedGroup)
  )

  const selectedGroupData = groups.find(g => g.id === selectedGroup)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--color-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Newspaper size={18} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Noticias</h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
              Publicaciones oficiales de colegios y grupos
            </p>
          </div>
        </div>

        {/* Filtro por grupo */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowGroupPicker(!showGroupPicker)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-bg-input)',
              cursor: 'pointer', color: 'var(--color-text)',
              fontSize: '14px', fontWeight: 500,
              transition: 'all var(--transition)',
            }}
          >
            <Users size={15} color="var(--color-text-muted)" />
            <span style={{ flex: 1, textAlign: 'left' }}>
              {selectedGroupData ? selectedGroupData.name : 'Todos los grupos'}
            </span>
            <ChevronDown size={15} color="var(--color-text-muted)"
              style={{ transition: 'transform var(--transition)', transform: showGroupPicker ? 'rotate(180deg)' : 'none' }} />
          </button>

          {showGroupPicker && (
            <div className="card slide-up" style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              zIndex: 50, padding: '6px', maxHeight: '220px', overflowY: 'auto',
            }}>
              <GroupOption
                name="Todos los grupos" selected={!selectedGroup}
                onClick={() => { setSelectedGroup(null); setShowGroupPicker(false) }}
              />
              {groups.map(g => (
                <GroupOption key={g.id} name={g.name} avatar={g.avatar_url}
                  selected={selectedGroup === g.id}
                  onClick={() => { setSelectedGroup(g.id); setShowGroupPicker(false) }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Creator (solo encargados/admin del grupo) ──────── */}
      {canPost && currentProfile && (
        <div>
          {selectedGroup ? (
            <PostCreator profile={currentProfile} section="news" groupId={selectedGroup} />
          ) : myGroups.length > 0 ? (
            <div className="card" style={{
              padding: '14px 16px',
              background: 'var(--color-primary-muted)',
              border: '1.5px solid var(--color-primary)',
            }}>
              <p style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600, margin: 0 }}>
                💡 Selecciona un grupo para publicar noticias
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Info para usuarios sin permisos ───────────────── */}
      {!isManager && currentProfile && (
        <div className="card" style={{
          padding: '12px 16px', fontSize: '13px',
          color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Newspaper size={14} />
          Solo los encargados de grupos pueden publicar aquí.
        </div>
      )}

      {/* ── Feed ──────────────────────────────────────────── */}
      <PostFeed
        section="news"
        groupId={selectedGroup || undefined}
        currentProfile={currentProfile}
      />
    </div>
  )
}

function GroupOption({ name, avatar, selected, onClick }: {
  name: string; avatar?: string | null; selected: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      width: '100%', padding: '8px 10px', border: 'none',
      background: selected ? 'var(--color-primary-muted)' : 'transparent',
      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
      color: selected ? 'var(--color-primary)' : 'var(--color-text)',
      fontSize: '14px', fontWeight: selected ? 600 : 400,
      textAlign: 'left', transition: 'all var(--transition)',
    }}>
      {avatar
        ? <img src={avatar} alt={name} style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} />
        : <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--color-primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {name[0]}
          </div>
      }
      {name}
      {selected && <span style={{ marginLeft: 'auto' }}>✓</span>}
    </button>
  )
}
