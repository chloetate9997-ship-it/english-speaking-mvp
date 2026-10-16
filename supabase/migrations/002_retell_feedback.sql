alter table public.retell_results
  add column if not exists next_exercise text not null default '';
