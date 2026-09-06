-- =============================================================================
-- 분실물센터 — lost_found_items 테이블 + 익명 업로드용 Storage 버킷
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0001_initial_schema.sql 실행 이후 언제든 실행 가능, public.is_officer() 사용)
--
-- ⚠️ 기존 테이블들과 접근 규칙이 다르다.
--    게시판·아카이브는 "임원만 작성"이지만, 분실물센터는 로그인 없는 학생이
--    직접 글을 쓰고 사진까지 올리는 공개 게시판이다. 그래서 insert 를 anon 에게
--    연다. 대신 완료 처리(update)와 삭제(delete)는 임원만 가능하다.
-- =============================================================================

create table if not exists public.lost_found_items (
  id               uuid        primary key default gen_random_uuid(),
  -- 'found' = 주웠어요(습득물), 'lost' = 잃어버렸어요(분실물)
  type             text        not null check (type in ('found', 'lost')),
  title            text        not null,
  description      text,
  -- 습득물: 주운 장소(필수), 분실물: 잃어버린 것 같은 장소(선택)
  location         text,
  -- 습득물 전용 보관 장소. 분실물이면 null
  storage_location text,
  image_url        text,
  reporter_name    text        not null,
  reporter_class   text        not null,
  is_resolved      boolean     not null default false,
  created_at       timestamptz not null default now(),

  -- 습득물은 어디서 주웠는지 · 어디에 보관 중인지가 있어야 주인이 찾아갈 수 있다.
  constraint lost_found_found_requires_location
    check (type <> 'found' or (location is not null and storage_location is not null))
);

comment on table public.lost_found_items is
  '분실물센터. 로그인 없이 학생이 직접 등록한다(insert 가 anon 에게 열려 있음).';
comment on column public.lost_found_items.reporter_class is
  '작성자 학급(예: "2학년 3반"). 주인/목격자가 찾아갈 수 있게 받는 값이라 연락처는 받지 않는다.';

-- 목록은 미해결 우선 + 최신순으로 보여준다.
create index if not exists lost_found_items_type_created_at_idx
  on public.lost_found_items (type, is_resolved, created_at desc);


-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.lost_found_items enable row level security;

-- 이 파일을 다시 실행해도 되도록 기존 정책을 먼저 지운다.
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lost_found_items'
  loop
    execute format('drop policy %I on public.lost_found_items', r.policyname);
  end loop;
end
$$;

-- 조회 · 등록은 누구나 (로그인 없는 학생이 쓰는 게시판)
create policy "누구나 분실물 조회"
  on public.lost_found_items for select
  to anon, authenticated
  using (true);

create policy "누구나 분실물 등록"
  on public.lost_found_items for insert
  to anon, authenticated
  with check (true);

-- 완료 처리 · 삭제는 임원만 (애플리케이션에서도 officers 조회로 이중 방어)
create policy "임원만 분실물 수정"
  on public.lost_found_items for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 분실물 삭제"
  on public.lost_found_items for delete
  to authenticated
  using (public.is_officer());


-- =============================================================================
-- Storage — lost-found 버킷 (익명 업로드 허용)
--
-- media 버킷은 임원 전용이라 그대로 두고, 익명 업로드는 이 버킷으로만 격리한다.
-- 버킷 자체에 용량·MIME 제한을 걸어두면 API 라우트를 우회해 anon 키로 직접
-- 올리려는 시도도 Storage 단에서 막힌다(이중 방어).
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lost-found',
  'lost-found',
  true,                       -- 공개 버킷: 이미지 URL 을 그대로 <img> 에 쓸 수 있다
  5242880,                    -- 파일당 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'lost-found %'
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end
$$;

create policy "lost-found 누구나 조회"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'lost-found');

-- 업로드만 익명 허용. 파일 경로는 서버(API 라우트)가 randomUUID 로 만들기 때문에
-- 남의 파일을 덮어쓰거나 경로를 조작할 수 없다.
create policy "lost-found 누구나 업로드"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'lost-found');

-- 수정 · 삭제는 임원만 (익명 사용자가 남의 사진을 지우지 못하게)
create policy "lost-found 임원만 수정"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'lost-found' and public.is_officer())
  with check (bucket_id = 'lost-found' and public.is_officer());

create policy "lost-found 임원만 삭제"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lost-found' and public.is_officer());
