-- 004_agent_rag.sql — 课程 RAG + AI 情景口语教练后端基础（不改旧迁移）
-- embedding: text-embedding-3-small, dim 1536

create extension if not exists "vector";
create extension if not exists "pgcrypto";

-- ============ target_expressions ============
create table if not exists public.target_expressions (
  id text primary key,
  lesson_id text not null references public.lessons (id) on delete cascade,
  expression text not null,
  chinese text not null default '',
  example text not null default '',
  scenario text not null default '',
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);
create index if not exists target_expressions_lesson_idx on public.target_expressions (lesson_id);

-- ============ knowledge_chunks ============
create table if not exists public.knowledge_chunks (
  id text primary key default ('kc-' || gen_random_uuid()::text),
  lesson_id text not null references public.lessons (id) on delete cascade,
  segment_id text,
  content_type text not null default 'segment' check (content_type in ('expression','segment','example')),
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists knowledge_chunks_lesson_idx on public.knowledge_chunks (lesson_id);
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

drop trigger if exists knowledge_chunks_touch on public.knowledge_chunks;
create trigger knowledge_chunks_touch before update on public.knowledge_chunks
  for each row execute function public.touch_updated_at();

-- ============ practice_sessions ============
create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  scenario text not null default '',
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  turn_count integer not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists practice_sessions_user_idx on public.practice_sessions (user_id);

drop trigger if exists practice_sessions_touch on public.practice_sessions;
create trigger practice_sessions_touch before update on public.practice_sessions
  for each row execute function public.touch_updated_at();

-- ============ practice_turns ============
create table if not exists public.practice_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  turn_no integer not null default 1,
  agent_question text not null default '',
  user_transcript text not null default '',
  feedback text not null default '',
  agent_action text not null default 'continue'
    check (agent_action in ('continue','hint','retry','simplify','complete')),
  target_expression_id text references public.target_expressions (id) on delete set null,
  scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, turn_no)
);
create index if not exists practice_turns_session_idx on public.practice_turns (session_id);

-- ============ expression_progress ============
create table if not exists public.expression_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expression_id text not null references public.target_expressions (id) on delete cascade,
  mastery numeric not null default 0 check (mastery >= 0 and mastery <= 1),
  error_count integer not null default 0,
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expression_id)
);
create index if not exists expression_progress_user_idx on public.expression_progress (user_id);

drop trigger if exists expression_progress_touch on public.expression_progress;
create trigger expression_progress_touch before update on public.expression_progress
  for each row execute function public.touch_updated_at();

-- ============ 相似度检索（强制 lessonId 过滤） ============
create or replace function public.match_knowledge_chunks(
  p_lesson_id text,
  p_query_embedding vector(1536),
  p_match_count integer default 5
)
returns table (
  id text,
  lesson_id text,
  segment_id text,
  content_type text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable as $$
  select
    kc.id, kc.lesson_id, kc.segment_id, kc.content_type, kc.content, kc.metadata,
    1 - (kc.embedding <=> p_query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.lesson_id = p_lesson_id
    and kc.embedding is not null
  order by kc.embedding <=> p_query_embedding
  limit greatest(1, least(coalesce(p_match_count, 5), 10));
$$;

-- ============ RLS ============
alter table public.target_expressions enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.practice_turns enable row level security;
alter table public.expression_progress enable row level security;

-- 课程知识：登录用户只读，不开放写入
create policy "expressions_select_auth" on public.target_expressions
  for select to authenticated using (true);
create policy "chunks_select_auth" on public.knowledge_chunks
  for select to authenticated using (true);

-- 用户数据：仅本人
create policy "sessions_all_own" on public.practice_sessions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "turns_all_own" on public.practice_turns
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expr_progress_all_own" on public.expression_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on all tables in schema public from anon, authenticated;
grant select on public.lessons to anon, authenticated;
grant select on public.lesson_segments to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.learning_progress to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.retell_results to authenticated;
grant select on public.target_expressions to authenticated;
grant select on public.knowledge_chunks to authenticated;
grant select, insert, update, delete on public.practice_sessions to authenticated;
grant select, insert, update, delete on public.practice_turns to authenticated;
grant select, insert, update, delete on public.expression_progress to authenticated;
grant execute on function public.match_knowledge_chunks(text, vector, integer) to authenticated;

-- ============ lesson-01 种子（基于现有 Mock：5 segments + 4 短语笔记 + retell 示例） ============
insert into public.target_expressions (id, lesson_id, expression, chinese, example, scenario, difficulty) values
  ('lesson-01-exp-01','lesson-01','In my opinion','依我看来','In my opinion, computers were one of the most important inventions.','讨论最伟大的发明',1),
  ('lesson-01-exp-02','lesson-01','I believe','我相信','I believe airplanes changed the way we travel.','讨论发明的影响',1),
  ('lesson-01-exp-03','lesson-01','I would say','我会说','I would say the computer was the best invention.','表达个人判断',2),
  ('lesson-01-exp-04','lesson-01','I see what you are saying, but...','我明白你的意思，但是……','I see what you are saying, but modern airplanes also depend on computers.','礼貌回应不同意见',2),
  ('lesson-01-exp-05','lesson-01','I couldn''t agree more','我完全同意','I couldn''t agree more — computers changed everything.','表示赞同',2),
  ('lesson-01-exp-06','lesson-01','Suppose','假设','Suppose you are discussing inventions with friends.','引入假设话题',3),
  ('lesson-01-exp-07','lesson-01','point out','指出','She pointed out that airplanes also changed the world.','补充不同观点',3)
on conflict (id) do update set expression=excluded.expression, chinese=excluded.chinese,
  example=excluded.example, scenario=excluded.scenario, difficulty=excluded.difficulty;

insert into public.knowledge_chunks (id, lesson_id, segment_id, content_type, content, metadata) values
  ('lesson-01-kc-01','lesson-01','segment-01','segment','Suppose you are with a group of friends discussing the greatest inventions of the twentieth century. 假设你正在和朋友讨论二十世纪最伟大的发明。','{"expression_id":"lesson-01-exp-06","scenario":"朋友聚会讨论发明"}'),
  ('lesson-01-kc-02','lesson-01','segment-02','segment','One friend says that the computer was the best invention. 一位朋友认为电脑是最伟大的发明。','{"expression_id":"lesson-01-exp-01","scenario":"讨论最伟大的发明"}'),
  ('lesson-01-kc-03','lesson-01','segment-03','segment','Another friend disagrees and points out that airplanes also changed the world. 另一位朋友不同意，并指出飞机也改变了世界。','{"expression_id":"lesson-01-exp-07","scenario":"回应不同意见"}'),
  ('lesson-01-kc-04','lesson-01','segment-04','segment','You can respond politely by acknowledging the other opinion before explaining your reason. 你可以先认可对方的观点，再解释自己的理由。','{"expression_id":"lesson-01-exp-04","scenario":"礼貌回应不同意见"}'),
  ('lesson-01-kc-05','lesson-01','segment-05','segment','Useful phrases include I think, I believe, in my opinion, and I would say. 常用表达包括我认为、我相信、在我看来以及我会说。','{"expression_id":"lesson-01-exp-01","scenario":"表达观点"}'),
  ('lesson-01-kc-06','lesson-01',null,'expression','目标表达： I see what you are saying, but...（我明白你的意思，但是……）。先认可再转折，用于礼貌反驳。','{"expression_id":"lesson-01-exp-04","scenario":"礼貌回应不同意见"}'),
  ('lesson-01-kc-07','lesson-01',null,'example','地道示例： I see your point about airplanes, but in my opinion computers were the greater invention because modern aircraft could not operate without them.','{"expression_id":"lesson-01-exp-01","scenario":"讨论发明"}'),
  ('lesson-01-kc-08','lesson-01',null,'example','地道示例： In my opinion, computers were one of the most important inventions because modern airplanes also depend on them. 建议衔接语： I see your point, but...','{"expression_id":"lesson-01-exp-05","scenario":"表示赞同并补充理由"}')
on conflict (id) do update set lesson_id=excluded.lesson_id, segment_id=excluded.segment_id,
  content_type=excluded.content_type, content=excluded.content, metadata=excluded.metadata;
-- 注：embedding 由服务端脚本回填（lib/agent/rag.ts syncLessonKnowledge），此处留空避免编造向量。
