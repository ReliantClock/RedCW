// ============================================================
//  app/(main)/perfil/[id]/page.tsx
//  Perfil de usuario - vista propia (editable) y ajena
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileView from '@/components/perfil/ProfileView'
import Sidebar from '@/components/layout/Sidebar'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('alias').eq('id', params.id).single()
  return { title: data?.alias ? `@${data.alias}` : 'Perfil' }
}

export default async function PerfilPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentProfile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    currentProfile = data
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!targetProfile) notFound()

  // Posts del perfil (no anónimos, a menos que seas el dueño o admin)
  const isOwn = user?.id === params.id
  const isAdmin = currentProfile?.role === 'admin'

  const { data: posts } = await supabase
    .from('posts_with_author')
    .select('*')
    .eq('author_id', params.id)
    .eq(isOwn || isAdmin ? '' : 'is_anonymous', isOwn || isAdmin ? '' : false as any)
    .order('created_at', { ascending: false })
    .limit(20)

  // Conteo de publicaciones
  const { count: postCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', params.id)

  return (
    <div className="app-body">
      <div className="app-content">
        <ProfileView
          profile={targetProfile}
          currentProfile={currentProfile}
          posts={posts || []}
          postCount={postCount || 0}
          isOwn={isOwn}
        />
      </div>
      <aside className="app-sidebar">
        <Sidebar currentProfile={currentProfile} />
      </aside>
    </div>
  )
}
