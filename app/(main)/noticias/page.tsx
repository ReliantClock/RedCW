// ============================================================
//  app/(main)/noticias/page.tsx
//  Sección Noticias - publicaciones de colegios/grupos
// ============================================================

import { createClient } from '@/lib/supabase/server'
import NoticiasFeed from '@/components/noticias/NoticiasFeed'
import Sidebar from '@/components/layout/Sidebar'

export const metadata = { title: 'Noticias' }

export default async function NoticiasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Grupos disponibles
  const { data: groups } = await supabase
    .from('groups')
    .select('*, group_members(user_id, role)')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="app-body">
      <div className="app-content">
        <NoticiasFeed groups={groups || []} currentProfile={profile} />
      </div>
      <aside className="app-sidebar">
        <Sidebar currentProfile={profile} />
      </aside>
    </div>
  )
}
