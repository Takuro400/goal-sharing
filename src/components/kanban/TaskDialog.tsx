'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Task, Profile, TaskStatus, TaskPriority } from '@/types'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

interface TaskDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Profile[]
  projectId: string
  onSave: (task: Task) => void
  onDelete: (taskId: string) => void
}

export default function TaskDialog({
  task,
  open,
  onOpenChange,
  members,
  projectId,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const isNew = !task

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo' as TaskStatus,
    priority: task?.priority ?? 'medium' as TaskPriority,
    assignee_id: task?.assignee_id ?? '',
    due_date: task?.due_date ?? '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Reset form when task changes
  useState(() => {
    setForm({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium',
      assignee_id: task?.assignee_id ?? '',
      due_date: task?.due_date ?? '',
    })
  })

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)

    const payload = {
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
      project_id: projectId,
    }

    let result
    if (isNew) {
      result = await supabase.from('tasks').insert(payload).select('*, assignee:profiles(*)').single()
    } else {
      result = await supabase.from('tasks').update(payload).eq('id', task!.id).select('*, assignee:profiles(*)').single()
    }

    if (result.data) {
      onSave(result.data as Task)
    }
    setSaving(false)
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!task) return
    setSaving(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    onDelete(task.id)
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? 'タスクを作成' : 'タスクを編集'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>タイトル *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="タスクのタイトル"
            />
          </div>
          <div className="space-y-2">
            <Label>説明</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="詳細・メモ"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>ステータス</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>優先度</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>担当者</Label>
            <Select
              value={form.assignee_id}
              onValueChange={(v) => setForm({ ...form, assignee_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="担当者を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">未割当</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>期限</Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            {!isNew && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            )}
            <div className={`flex gap-2 ${isNew ? 'ml-auto' : ''}`}>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? '保存中...' : isNew ? '作成' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
