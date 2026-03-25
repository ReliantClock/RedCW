// ============================================================
//  app/(main)/comunidades/page.tsx
//  Sección Comunidades - lista de foros
// ============================================================

import { createClient } from '@/lib/supabase/server'
import ComunidadesList from '@/components/comunidades/ComunidadesList'
import Sidebar from '@/components/layout/Sidebar'

export const metadata = { title: 'Comunidades' }

export default async function ComunidadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Foros con membresía del usuario
  const { data: forums } = await supabase
    .from('forums')
    .select(`*, forum_members(user_id, role)`)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('member_count', { ascending: false })

  // Foros del usuario
  const { data: myForums } = user ? await supabase
    .from('forum_members')
    .select('forum_id, role')
    .eq('user_id', user.id) : { data: [] }

  const myForumIds = new Set((myForums || []).map(f => f.forum_id))

  const enriched = (forums || []).map(f => ({
    ...f,
    user_is_member: myForumIds.has(f.id),
    user_role: (myForums || []).find(m => m.forum_id === f.id)?.role || null,
  }))

  return (
    <div className="app-body">
      <div className="app-content">
        <ComunidadesList forums={enriched} currentProfile={profile} />
      </div>
      <aside className="app-sidebar">
        <Sidebar currentProfile={profile} />
      </aside>
    </div>
  )
}
