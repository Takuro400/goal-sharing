'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatDate, formatCurrency, daysUntil } from '@/lib/utils'
import type { Project, Milestone } from '@/types'
import {
  Target,
  Calendar,
  TrendingUp,
  Users,
  Plus,
  CheckCircle2,
  Circle,
  Pencil,
  Rocket,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface VisionBoardProps {
  project: Project
  milestones: Milestone[]
}

export default function VisionBoard({ project: initialProject, milestones: initialMilestones }: VisionBoardProps) {
  const [project, setProject] = useState(initialProject)
  const [milestones, setMilestones] = useState(initialMilestones)
  const [editOpen, setEditOpen] = useState(false)
  const [milestoneOpen, setMilestoneOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    vision: project.vision ?? '',
    open_date: project.open_date ?? '',
    revenue_goal: project.revenue_goal?.toString() ?? '',
    student_goal: project.student_goal?.toString() ?? '',
  })

  const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '' })

  const supabase = createClient()

  const daysToOpen = daysUntil(project.open_date)
  const completedMilestones = milestones.filter((m) => m.completed).length

  async function saveProject() {
    setSaving(true)
    const { data } = await supabase
      .from('projects')
      .update({
        vision: editForm.vision,
        open_date: editForm.open_date || null,
        revenue_goal: editForm.revenue_goal ? parseInt(editForm.revenue_goal) : null,
        student_goal: editForm.student_goal ? parseInt(editForm.student_goal) : null,
      })
      .eq('id', project.id)
      .select()
      .single()

    if (data) setProject(data as Project)
    setSaving(false)
    setEditOpen(false)
  }

  async function addMilestone() {
    if (!newMilestone.title.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('milestones')
      .insert({
        project_id: project.id,
        title: newMilestone.title,
        due_date: newMilestone.due_date || null,
        sort_order: milestones.length,
      })
      .select()
      .single()

    if (data) setMilestones((prev) => [...prev, data as Milestone])
    setNewMilestone({ title: '', due_date: '' })
    setSaving(false)
    setMilestoneOpen(false)
  }

  async function toggleMilestone(milestone: Milestone) {
    const { data } = await supabase
      .from('milestones')
      .update({ completed: !milestone.completed })
      .eq('id', milestone.id)
      .select()
      .single()

    if (data) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestone.id ? (data as Milestone) : m))
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Vision Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white" />
          <div className="absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-white" />
        </div>
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                <span className="text-sm font-medium text-indigo-200">ミッション・ビジョン</span>
              </div>
              <p className="text-xl font-bold leading-relaxed md:text-2xl">
                {project.vision || '「ビジョンを編集」からミッションを入力しましょう'}
              </p>
            </div>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 flex-shrink-0">
                  <Pencil className="h-4 w-4" />
                  編集
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ビジョン・目標を編集</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ビジョン文</Label>
                    <Textarea
                      value={editForm.vision}
                      onChange={(e) => setEditForm({ ...editForm, vision: e.target.value })}
                      placeholder="例：総合型選抜に挑む全ての高校生の可能性を最大化する"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>開塾予定日</Label>
                    <Input
                      type="date"
                      value={editForm.open_date}
                      onChange={(e) => setEditForm({ ...editForm, open_date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>売上目標（円）</Label>
                      <Input
                        type="number"
                        value={editForm.revenue_goal}
                        onChange={(e) => setEditForm({ ...editForm, revenue_goal: e.target.value })}
                        placeholder="10000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>生徒数目標</Label>
                      <Input
                        type="number"
                        value={editForm.student_goal}
                        onChange={(e) => setEditForm({ ...editForm, student_goal: e.target.value })}
                        placeholder="50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditOpen(false)}>キャンセル</Button>
                    <Button onClick={saveProject} disabled={saving}>
                      {saving ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* KPI stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4">
              <div className="flex items-center gap-2 text-indigo-200">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">開塾予定日</span>
              </div>
              <div className="mt-1 font-bold">{formatDate(project.open_date)}</div>
              {daysToOpen !== null && (
                <div className="text-xs text-indigo-200 mt-0.5">
                  {daysToOpen > 0 ? `あと ${daysToOpen} 日` : daysToOpen === 0 ? '今日！' : `${Math.abs(daysToOpen)} 日経過`}
                </div>
              )}
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="flex items-center gap-2 text-indigo-200">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">売上目標</span>
              </div>
              <div className="mt-1 font-bold">{formatCurrency(project.revenue_goal)}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-indigo-200">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">生徒数目標</span>
              </div>
              <div className="mt-1 font-bold">
                {project.student_goal ? `${project.student_goal} 名` : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            ロードマップ
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {completedMilestones} / {milestones.length} 完了
            </Badge>
            <Dialog open={milestoneOpen} onOpenChange={setMilestoneOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>マイルストーンを追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>タイトル</Label>
                    <Input
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                      placeholder="例：ウェブサイト公開"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>期限</Label>
                    <Input
                      type="date"
                      value={newMilestone.due_date}
                      onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setMilestoneOpen(false)}>キャンセル</Button>
                    <Button onClick={addMilestone} disabled={saving || !newMilestone.title.trim()}>
                      追加
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Target className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">まだマイルストーンがありません。「追加」から作成しましょう。</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="relative flex items-start gap-4 pl-10 py-1"
                  >
                    <button
                      onClick={() => toggleMilestone(milestone)}
                      className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-200 transition-colors hover:border-indigo-400"
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                    </button>
                    <div className={`flex-1 ${milestone.completed ? 'opacity-60' : ''}`}>
                      <p className={`text-sm font-medium ${milestone.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {milestone.title}
                      </p>
                      {milestone.due_date && (
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(milestone.due_date)}</p>
                      )}
                    </div>
                    {milestone.completed && (
                      <Badge variant="success" className="flex-shrink-0">完了</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
