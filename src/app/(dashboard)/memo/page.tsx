import { createClient } from '@/lib/supabase/server'
import MemoBoard from '@/components/memo/MemoBoard'
import type { Note, Profile } from '@/types'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MemoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('profile_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/vision')

  const projectId = membership.project_id

  const [{ data: notes }, { data: members }] = await Promise.all([
    supabase
      .from('notes')
      .select('*, author:profiles(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
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
        <h1 className="text-2xl font-bold text-gray-900">クイックメモ</h1>
        <p className="text-sm text-gray-500 mt-1">塾のコンセプト・差別化ポイント・議事録をストック</p>
      </div>
      <MemoBoard
        initialNotes={(notes ?? []) as Note[]}
        members={profiles}
        projectId={projectId}
      />
    </div>
  )
}
