'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TaskCard from './TaskCard'
import TaskDialog from './TaskDialog'
import type { Task, Profile, TaskStatus } from '@/types'
import { TASK_STATUS_LABELS } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Plus, Zap } from 'lucide-react'

interface KanbanBoardProps {
  initialTasks: Task[]
  members: Profile[]
  projectId: string
}

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

const columnStyles: Record<TaskStatus, { header: string; dot: string; badge: string }> = {
  todo: {
    header: 'text-gray-600',
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-600',
  },
  in_progress: {
    header: 'text-blue-600',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-600',
  },
  review: {
    header: 'text-amber-600',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-600',
  },
  done: {
    header: 'text-green-600',
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-600',
  },
}

export default function KanbanBoard({ initialTasks, members, projectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')

  const supabase = createClient()

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id))
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Fetch with assignee joined
            const { data } = await supabase
              .from('tasks')
              .select('*, assignee:profiles(*)')
              .eq('id', (payload.new as Task).id)
              .single()
            if (data) {
              setTasks((prev) => {
                const exists = prev.find((t) => t.id === data.id)
                if (exists) return prev.map((t) => (t.id === data.id ? data as Task : t))
                return [...prev, data as Task]
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  function openNewTask(status: TaskStatus) {
    setSelectedTask(null)
    setDefaultStatus(status)
    setDialogOpen(true)
  }

  function openEditTask(task: Task) {
    setSelectedTask(task)
    setDialogOpen(true)
  }

  function handleSave(task: Task) {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id)
      if (exists) return prev.map((t) => (t.id === task.id ? task : t))
      return [...prev, task]
    })
  }

  function handleDelete(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const tasksByStatus = COLUMNS.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-gray-500 font-medium">リアルタイム同期中</span>
          <span className="flex h-2 w-2 rounded-full bg-green-400" />
        </div>
        <Button size="sm" onClick={() => openNewTask('todo')}>
          <Plus className="h-4 w-4" />
          タスクを追加
        </Button>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((status) => {
          const style = columnStyles[status]
          const columnTasks = tasksByStatus[status]

          return (
            <div key={status} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <span className={`text-sm font-semibold ${style.header}`}>
                    {TASK_STATUS_LABELS[status]}
                  </span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-2 min-h-[120px]">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={openEditTask} />
                ))}
              </div>

              {/* Add button */}
              <button
                onClick={() => openNewTask(status)}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                タスクを追加
              </button>
            </div>
          )
        })}
      </div>

      <TaskDialog
        task={selectedTask}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedTask(null)
        }}
        members={members}
        projectId={projectId}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
