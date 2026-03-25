// ============================================================
//  app/(main)/comunidades/[id]/page.tsx
//  Página de un foro individual
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ForumPage from '@/components/comunidades/ForumPage'
import Sidebar from '@/components/layout/Sidebar'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('forums').select('name').eq('id', params.id).single()
  return { title: data?.name || 'Comunidad' }
}

export default async function ComunidadPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: forum } = await supabase
    .from('forums')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!forum) notFound()

  // Membresía del usuario
  let membership = null
  if (user) {
    const { data } = await supabase
      .from('forum_members')
      .select('role')
      .eq('forum_id', forum.id)
      .eq('user_id', user.id)
      .single()
    membership = data
  }

  const isMember = !!membership || forum.type === 'public' || forum.type === 'anonymous' || forum.is_default

  return (
    <div className="app-body">
      <div className="app-content">
        <ForumPage
          forum={{ ...forum, user_is_member: !!membership, user_role: membership?.role || null }}
          currentProfile={profile}
          isMember={isMember}
        />
      </div>
      <aside className="app-sidebar">
        <Sidebar currentProfile={profile} />
      </aside>
    </div>
  )
}
