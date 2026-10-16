-- 001_initial_schema.sql
-- 口语训练 MVP 初始表结构：profiles / lessons / lesson_segments /
-- learning_progress / notes / retell_results + 私有 Storage bucket。

-- ============ 扩展 ============
create extension if not exists "pgcrypto";

-- ============ profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ lessons ============
create table if not exists public.lessons (
  id text primary key,
  order_no integer not null,
  title text not null,
  subtitle text not null default '',
  duration_seconds integer not null default 0,
  audio_url text not null default '',
  status text not null default 'not-started',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lessons_order_idx on public.lessons (order_no);

-- ============ lesson_segments ============
create table if not exists public.lesson_segments (
  id text primary key,
  lesson_id text not null references public.lessons (id) on delete cascade,
  order_no integer not null,
  english_text text not null default '',
  chinese_text text not null default '',
  start_seconds integer not null default 0,
  end_seconds integer not null default 0,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (lesson_id, order_no)
);
create index if not exists lesson_segments_lesson_idx
  on public.lesson_segments (lesson_id);

-- ============ learning_progress ============
create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  status text not null default 'in-progress',
  progress_seconds integer not null default 0,
  last_studied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index if not exists learning_progress_user_idx
  on public.learning_progress (user_id);

-- ============ notes ============
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  segment_id text,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_lesson_idx
  on public.notes (user_id, lesson_id);

-- ============ retell_results ============
create table if not exists public.retell_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  scope text not null default 'full',
  selected_segment_ids text[] not null default '{}',
  recording_path text,
  transcript text not null default '',
  content_score integer,
  covered_points text[] not null default '{}',
  missed_points text[] not null default '{}',
  language_suggestions text[] not null default '{}',
  natural_version text not null default '',
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists retell_results_user_idx
  on public.retell_results (user_id);

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_segments enable row level security;
alter table public.learning_progress enable row level security;
alter table public.notes enable row level security;
alter table public.retell_results enable row level security;

-- profiles：仅本人读写
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- lessons / segments：已发布内容所有人只读（含匿名），客户端不开放写入
create policy "lessons_select_published" on public.lessons
  for select using (published = true);
create policy "segments_select_published" on public.lesson_segments
  for select using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_segments.lesson_id and l.published = true
    )
  );

-- learning_progress：仅本人
create policy "progress_all_own" on public.learning_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notes：仅本人
create policy "notes_all_own" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- retell_results：仅本人
create policy "retell_all_own" on public.retell_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ Grants：收紧到最小 ============
revoke all on all tables in schema public from anon, authenticated;

grant select on public.lessons to anon, authenticated;
grant select on public.lesson_segments to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.learning_progress to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.retell_results to authenticated;

-- ============ Storage：私有 bucket ============
insert into storage.buckets (id, name, public)
values ('retell-recordings', 'retell-recordings', false)
on conflict (id) do nothing;

create policy "recordings_owner_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'retell-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "recordings_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'retell-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "recordings_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'retell-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'retell-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "recordings_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'retell-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============ updated_at 自动维护 ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists lessons_touch on public.lessons;
create trigger lessons_touch before update on public.lessons
  for each row execute function public.touch_updated_at();
drop trigger if exists progress_touch on public.learning_progress;
create trigger progress_touch before update on public.learning_progress
  for each row execute function public.touch_updated_at();
drop trigger if exists notes_touch on public.notes;
create trigger notes_touch before update on public.notes
  for each row execute function public.touch_updated_at();
drop trigger if exists retell_touch on public.retell_results;
create trigger retell_touch before update on public.retell_results
  for each row execute function public.touch_updated_at();
