import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import type { Task, Profile } from '@/types'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get project
  const { data: membership } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('profile_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/vision')

  const projectId = membership.project_id

  const [{ data: tasks }, { data: members }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, assignee:profiles(*)')
      .eq('project_id', projectId)
      .order('sort_order'),
    supabase
      .from('project_members')
      .select('profile_id')
      .eq('project_id', projectId),
  ])

  const profileIds = (members ?? []).map((m) => m.profile_id)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .in('id', profileIds)

  const profiles = (profileData ?? []) as Profile[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">カンバンボード</h1>
        <p className="text-sm text-gray-500 mt-1">タスクの進捗をリアルタイムで共有・管理</p>
      </div>
      <KanbanBoard
        initialTasks={(tasks ?? []) as Task[]}
        members={profiles}
        projectId={projectId}
      />
    </div>
  )
}
