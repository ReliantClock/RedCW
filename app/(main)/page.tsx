// ============================================================
//  app/(main)/page.tsx
//  Página de Inicio - Feed principal con sidebar
// ============================================================

import PostFeed from '@/components/posts/PostFeed'
import PostCreator from '@/components/posts/PostCreator'
import Sidebar from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Inicio' }

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <div className="app-body">
      <div className="app-content">
        {/* Crear publicación (solo si está logueado) */}
        {profile && <PostCreator profile={profile} section="home" />}

        {/* Feed de publicaciones */}
        <PostFeed section="home" currentProfile={profile} />
      </div>

      {/* Sidebar derecho */}
      <aside className="app-sidebar">
        <Sidebar currentProfile={profile} />
      </aside>
    </div>
  )
}
