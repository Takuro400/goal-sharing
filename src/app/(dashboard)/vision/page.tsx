import { createClient } from '@/lib/supabase/server'
import VisionBoard from '@/components/vision/VisionBoard'
import type { Project, Milestone } from '@/types'

export const dynamic = 'force-dynamic'

async function getOrCreateProject(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // Get first project user is member of
  const { data: membership } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('profile_id', userId)
    .limit(1)
    .single()

  if (membership) {
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', membership.project_id)
      .single()
    return project as Project
  }

  // Create default project if none exists
  const { data: project } = await supabase
    .from('projects')
    .insert({
      name: '総合型選抜オンライン塾',
      description: 'チームの目標・タスクを共有するプロジェクト',
      vision: '総合型選抜に挑む全ての高校生の可能性を最大化する',
      owner_id: userId,
    })
    .select()
    .single()

  if (project) {
    await supabase.from('project_members').insert({
      project_id: project.id,
      profile_id: userId,
    })
  }

  return project as Project
}

export default async function VisionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const project = await getOrCreateProject(supabase, user.id)

  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ビジョン・ロードマップ</h1>
        <p className="text-sm text-gray-500 mt-1">チームのミッションと達成目標を常に確認しましょう</p>
      </div>
      <VisionBoard
        project={project}
        milestones={(milestones ?? []) as Milestone[]}
      />
    </div>
  )
}
