-- 005_grant_service_role.sql — 补足 service_role 对服务端直读写表的权限（004 revoke 后 service_role 被误收回）
-- 不修改旧迁移，仅追加授权；服务端脚本使用 SUPABASE_SERVICE_ROLE_KEY 需要这些权限。

grant all on public.target_expressions to service_role;
grant all on public.knowledge_chunks to service_role;
grant all on public.practice_sessions to service_role;
grant all on public.practice_turns to service_role;
grant all on public.expression_progress to service_role;
grant execute on function public.match_knowledge_chunks(text, vector, integer) to service_role;
