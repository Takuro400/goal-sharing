export type UserRole = 'admin' | 'member'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type NoteCategory = 'general' | 'concept' | 'differentiator' | 'meeting' | 'other'

export interface Profile {
  id: string
  name: string
  email: string
  avatar_url?: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string | null
  vision?: string | null
  open_date?: string | null
  revenue_goal?: number | null
  student_goal?: number | null
  owner_id?: string | null
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  due_date?: string | null
  completed: boolean
  sort_order: number
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee_id?: string | null
  due_date?: string | null
  sort_order: number
  created_by?: string | null
  created_at: string
  updated_at: string
  assignee?: Profile | null
}

export interface Note {
  id: string
  project_id: string
  title: string
  content: string
  category: NoteCategory
  pinned: boolean
  created_by?: string | null
  created_at: string
  updated_at: string
  author?: Profile | null
}

export interface ProjectMember {
  project_id: string
  profile_id: string
  joined_at: string
  profile?: Profile
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '未着手',
  in_progress: '進行中',
  review: 'レビュー中',
  done: '完了',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  general: '一般',
  concept: '塾のコンセプト',
  differentiator: '差別化ポイント',
  meeting: '議事録',
  other: 'その他',
}
