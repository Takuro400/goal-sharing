'use client'

import { useEffect, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Note, Profile, NoteCategory } from '@/types'
import { NOTE_CATEGORY_LABELS } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getInitials } from '@/lib/utils'
import { Plus, Pin, PinOff, Pencil, Trash2, StickyNote, Zap } from 'lucide-react'

interface MemoBoardProps {
  initialNotes: Note[]
  members: Profile[]
  projectId: string
}

const categoryColors: Record<NoteCategory, string> = {
  general: 'secondary',
  concept: 'default',
  differentiator: 'info',
  meeting: 'warning',
  other: 'secondary',
} as const

export default function MemoBoard({ initialNotes, members, projectId }: MemoBoardProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [createOpen, setCreateOpen] = useState(false)
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState<NoteCategory | 'all'>('all')

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general' as NoteCategory,
  })

  const supabase = createClient()

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `project_id=eq.${projectId}` },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setNotes((prev) => prev.filter((n) => n.id !== payload.old.id))
          } else {
            const { data } = await supabase
              .from('notes')
              .select('*, author:profiles(*)')
              .eq('id', (payload.new as Note).id)
              .single()
            if (data) {
              setNotes((prev) => {
                const exists = prev.find((n) => n.id === data.id)
                if (exists) return prev.map((n) => (n.id === data.id ? data as Note : n))
                return [...prev, data as Note]
              })
            }
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setForm({ title: '', content: '', category: 'general' })
  }

  function openEdit(note: Note) {
    setEditNote(note)
    setForm({ title: note.title, content: note.content, category: note.category })
  }

  async function handleCreate() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('notes')
      .insert({ ...form, project_id: projectId })
      .select('*, author:profiles(*)')
      .single()
    if (data) setNotes((prev) => [data as Note, ...prev])
    resetForm()
    setSaving(false)
    setCreateOpen(false)
  }

  async function handleUpdate() {
    if (!editNote || !form.title.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('notes')
      .update({ title: form.title, content: form.content, category: form.category })
      .eq('id', editNote.id)
      .select('*, author:profiles(*)')
      .single()
    if (data) setNotes((prev) => prev.map((n) => (n.id === editNote.id ? data as Note : n)))
    setSaving(false)
    setEditNote(null)
    resetForm()
  }

  async function togglePin(note: Note) {
    const { data } = await supabase
      .from('notes')
      .update({ pinned: !note.pinned })
      .eq('id', note.id)
      .select('*, author:profiles(*)')
      .single()
    if (data) setNotes((prev) => prev.map((n) => (n.id === note.id ? data as Note : n)))
  }

  async function deleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const filteredNotes = notes
    .filter((n) => filterCategory === 'all' || n.category === filterCategory)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-gray-500 font-medium">リアルタイム同期中</span>
          <span className="flex h-2 w-2 rounded-full bg-green-400" />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filterCategory}
            onValueChange={(v) => setFilterCategory(v as NoteCategory | 'all')}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのカテゴリ</SelectItem>
              {(Object.keys(NOTE_CATEGORY_LABELS) as NoteCategory[]).map((c) => (
                <SelectItem key={c} value={c}>{NOTE_CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                メモを追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>メモを作成</DialogTitle>
              </DialogHeader>
              <NoteForm form={form} setForm={setForm} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} saving={saving} submitLabel="作成" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <StickyNote className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">まだメモがありません。チームの知識をストックしましょう。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className={`group relative flex flex-col ${note.pinned ? 'ring-2 ring-indigo-200' : ''}`}>
              {note.pinned && (
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 shadow">
                  <Pin className="h-3 w-3 text-white" />
                </div>
              )}
              <CardHeader className="pb-2 flex-row items-start justify-between space-y-0 gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm leading-snug truncate">{note.title}</CardTitle>
                  <Badge
                    variant={categoryColors[note.category] as 'secondary' | 'default' | 'info' | 'warning'}
                    className="mt-1.5 text-xs"
                  >
                    {NOTE_CATEGORY_LABELS[note.category]}
                  </Badge>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => togglePin(note)}
                    className="rounded-md p-1.5 hover:bg-gray-100 text-gray-400"
                    title={note.pinned ? 'ピン解除' : 'ピン留め'}
                  >
                    {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => openEdit(note)}
                    className="rounded-md p-1.5 hover:bg-gray-100 text-gray-400"
                    title="編集"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="rounded-md p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500"
                    title="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-6">
                  {note.content || <span className="text-gray-300 italic">内容なし</span>}
                </p>
              </CardContent>
              <div className="px-6 pb-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                {note.author && (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700"
                    title={note.author.name}
                  >
                    {getInitials(note.author.name)}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editNote} onOpenChange={(o) => { if (!o) { setEditNote(null); resetForm() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メモを編集</DialogTitle>
          </DialogHeader>
          <NoteForm form={form} setForm={setForm} onSubmit={handleUpdate} onCancel={() => { setEditNote(null); resetForm() }} saving={saving} submitLabel="保存" />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NoteForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
}: {
  form: { title: string; content: string; category: NoteCategory }
  setForm: (f: { title: string; content: string; category: NoteCategory }) => void
  onSubmit: () => void
  onCancel: () => void
  saving: boolean
  submitLabel: string
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>タイトル *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="メモのタイトル"
        />
      </div>
      <div className="space-y-2">
        <Label>カテゴリ</Label>
        <Select
          value={form.category}
          onValueChange={(v) => setForm({ ...form, category: v as NoteCategory })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(NOTE_CATEGORY_LABELS) as NoteCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{NOTE_CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>内容</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="メモの内容"
          rows={6}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>キャンセル</Button>
        <Button onClick={onSubmit} disabled={saving || !form.title.trim()}>
          {saving ? '保存中...' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
