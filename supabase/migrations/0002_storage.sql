-- =============================================================================
-- Supabase Storage — 이미지 공용 버킷
--
-- 반드시 0001_initial_schema.sql 을 먼저 실행한 뒤 실행할 것
-- (public.is_officer() 함수를 사용하기 때문).
--
-- 버킷 하나(media)를 board / monthly / archive 가 폴더로 나눠 쓴다.
--   media/board/<파일명>
--   media/monthly/<파일명>
--   media/archive/<파일명>
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,                       -- 공개 버킷: 이미지 URL 을 그대로 <img> 에 쓸 수 있다
  5242880,                    -- 파일당 5MB (무료 티어 저장용량 1GB 를 고려한 값)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- 이 파일을 다시 실행해도 되도록 media 버킷 관련 기존 정책을 먼저 지운다.
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'media %'
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end
$$;


-- 읽기는 누구나 (공개 버킷이라 CDN URL 로도 접근 가능)
create policy "media 누구나 조회"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

-- 업로드 · 수정 · 삭제는 임원만
create policy "media 임원만 업로드"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_officer());

create policy "media 임원만 수정"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.is_officer())
  with check (bucket_id = 'media' and public.is_officer());

create policy "media 임원만 삭제"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.is_officer());
