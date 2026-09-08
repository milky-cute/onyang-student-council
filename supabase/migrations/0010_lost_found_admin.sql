-- =============================================================================
-- 분실물센터 (임원 등록 전용) — lost_found_items 테이블 + lost-found Storage 버킷
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0001_initial_schema.sql 실행 이후 언제든 실행 가능, public.is_officer() 사용)
--
-- 0008 에서 만들었던 같은 이름의 테이블/버킷은 0009 로 이미 삭제된 상태다.
-- 그때와 달리 이번에는 등록도 임원 전용이다 — 학생은 목록 조회만 할 수 있고,
-- 물건을 주우면 자치회에 맡기면 임원이 대신 등록한다.
-- =============================================================================

create table if not exists public.lost_found_items (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,              -- 물품 이름 (예: '검정색 우산')
  description      text,                              -- 물품 설명 (선택)
  location         text        not null,              -- 습득 장소 (어디서 주웠는지)
  storage_location text        not null,              -- 보관 장소 (지금 어디에 있는지)
  image_url        text,                              -- 사진 (선택)
  is_resolved      boolean     not null default false, -- 주인이 찾아갔는지
  created_at       timestamptz not null default now()
);

comment on table public.lost_found_items is
  '분실물센터 습득물. 등록·수정·삭제는 임원만, 조회는 누구나 가능하다.';
comment on column public.lost_found_items.storage_location is
  '물건을 보관 중인 장소. 주인이 찾으러 갈 곳이라 필수다.';
comment on column public.lost_found_items.is_resolved is
  '주인이 찾아갔는지 여부. 완료된 항목도 목록에서 지우지 않고 흐리게 표시한다(중복 문의 방지).';

-- 목록은 아직 안 찾아간 물건 우선 + 최신순으로 보여준다.
create index if not exists lost_found_items_resolved_created_at_idx
  on public.lost_found_items (is_resolved, created_at desc);


-- =============================================================================
-- Row Level Security
--
-- 조회만 공개, 나머지는 전부 임원(is_officer()) 전용.
-- 애플리케이션(API 라우트)에서도 officers 테이블을 한 번 더 확인한다(이중 방어).
-- =============================================================================
alter table public.lost_found_items enable row level security;

-- 이 파일을 다시 실행해도 "policy already exists" 로 막히지 않도록 먼저 지운다.
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

create policy "누구나 분실물 조회"
  on public.lost_found_items for select
  to anon, authenticated
  using (true);

create policy "임원만 분실물 등록"
  on public.lost_found_items for insert
  to authenticated
  with check (public.is_officer());

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
-- Storage — lost-found 버킷
--
-- media 버킷(게시판·아카이브)과 섞이지 않게 분실물 사진만 따로 담는다.
-- 권한 규칙은 media 와 동일하다: 조회는 누구나, 쓰기는 임원만.
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

create policy "lost-found 임원만 업로드"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lost-found' and public.is_officer());

create policy "lost-found 임원만 수정"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'lost-found' and public.is_officer())
  with check (bucket_id = 'lost-found' and public.is_officer());

create policy "lost-found 임원만 삭제"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lost-found' and public.is_officer());
