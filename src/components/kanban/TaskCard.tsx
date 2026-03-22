'use client'

import { Badge } from '@/components/ui/badge'
import { formatDate, getInitials } from '@/lib/utils'
import type { Task } from '@/types'
import { TASK_PRIORITY_LABELS } from '@/types'
import { Calendar, AlertCircle } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
}

const priorityStyles = {
  low: 'secondary' as const,
  medium: 'warning' as const,
  high: 'destructive' as const,
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const daysLeft = task.due_date
    ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div
      className="cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 flex-1">
          {task.title}
        </p>
        <Badge variant={priorityStyles[task.priority]} className="flex-shrink-0 text-xs">
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          {daysLeft !== null && (
            <span
              className={`flex items-center gap-1 text-xs ${
                daysLeft < 0
                  ? 'text-red-500'
                  : daysLeft <= 3
                  ? 'text-amber-500'
                  : 'text-gray-400'
              }`}
            >
              {daysLeft < 0 ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
        {task.assignee && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700"
            title={task.assignee.name}
          >
            {getInitials(task.assignee.name)}
          </div>
        )}
      </div>
    </div>
  )
}
