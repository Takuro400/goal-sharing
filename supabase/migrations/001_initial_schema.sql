-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- USERS (profiles)
-- =====================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  avatar_url  text,
  role        text not null default 'member' check (role in ('admin', 'member')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================
-- PROJECTS
-- =====================
create table if not exists public.projects (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  vision        text,                        -- ビジョン文
  open_date     date,                        -- 開塾予定日
  revenue_goal  bigint,                      -- 売上目標（円）
  student_goal  int,                         -- 生徒数目標
  owner_id      uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =====================
-- MILESTONES (ロードマップ用)
-- =====================
create table if not exists public.milestones (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  due_date    date,
  completed   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- =====================
-- TASKS (カンバンボード)
-- =====================
create table if not exists public.tasks (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  title        text not null,
  description  text,
  status       text not null default 'todo'
                 check (status in ('todo', 'in_progress', 'review', 'done')),
  priority     text not null default 'medium'
                 check (priority in ('low', 'medium', 'high')),
  assignee_id  uuid references public.profiles(id) on delete set null,
  due_date     date,
  sort_order   int not null default 0,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- =====================
-- NOTES (クイックメモ)
-- =====================
create table if not exists public.notes (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  content     text not null default '',
  category    text not null default 'general'
                check (category in ('general', 'concept', 'differentiator', 'meeting', 'other')),
  pinned      boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================
-- PROJECT MEMBERS
-- =====================
create table if not exists public.project_members (
  project_id  uuid not null references public.projects(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (project_id, profile_id)
);

-- =====================
-- RLS POLICIES
-- =====================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.project_members enable row level security;

-- Profiles: users can read all, update own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Projects: members can read, admins can update
create policy "projects_select" on public.projects for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = id and pm.profile_id = auth.uid()
    )
  );
create policy "projects_insert" on public.projects for insert
  with check (auth.uid() = owner_id);
create policy "projects_update" on public.projects for update
  using (auth.uid() = owner_id);

-- Project members
create policy "project_members_select" on public.project_members for select using (true);
create policy "project_members_insert" on public.project_members for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- Milestones, Tasks, Notes: project members only
create policy "milestones_select" on public.milestones for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = milestones.project_id and pm.profile_id = auth.uid()
    )
  );
create policy "milestones_all" on public.milestones for all
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = milestones.project_id and pm.profile_id = auth.uid()
    )
  );

create policy "tasks_select" on public.tasks for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = tasks.project_id and pm.profile_id = auth.uid()
    )
  );
create policy "tasks_all" on public.tasks for all
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = tasks.project_id and pm.profile_id = auth.uid()
    )
  );

create policy "notes_select" on public.notes for select
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = notes.project_id and pm.profile_id = auth.uid()
    )
  );
create policy "notes_all" on public.notes for all
  using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = notes.project_id and pm.profile_id = auth.uid()
    )
  );

-- =====================
-- FUNCTIONS & TRIGGERS
-- =====================

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger set_notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- =====================
-- REALTIME
-- =====================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.milestones;
