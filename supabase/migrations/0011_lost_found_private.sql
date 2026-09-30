-- =============================================================================
-- 분실물센터 — 임원만 보는 비공개 정보 (lost_found_private)
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0010_lost_found_admin.sql 실행 이후. public.is_officer() 사용)
--
-- lost_found_items 는 행 전체가 누구나 조회 가능(select to anon)하다.
-- 그래서 주인 확인용 특징이나 받아간 사람 같은 정보를 거기 컬럼으로 넣으면
-- anon 키로 그대로 읽힌다. 반드시 이 별도 테이블에만 저장한다.
-- =============================================================================

create table if not exists public.lost_found_private (
  item_id      uuid        primary key references public.lost_found_items (id) on delete cascade,
  private_note text,        -- 주인 확인용 특징 (예: 케이스 스티커, 흠집 위치)
  claimed_by   text,        -- 받아간 사람 (이름·학번, 선택)
  claimed_at   timestamptz  -- 받아간 시각
);

comment on table public.lost_found_private is
  '분실물의 임원 전용 정보. 조회를 포함한 모든 접근이 임원(is_officer())으로 제한된다.';


-- =============================================================================
-- Row Level Security — 조회까지 전부 임원 전용
-- 애플리케이션(API 라우트)에서도 officers 테이블을 한 번 더 확인한다(이중 방어).
-- =============================================================================
alter table public.lost_found_private enable row level security;

-- 이 파일을 다시 실행해도 "policy already exists" 로 막히지 않도록 먼저 지운다.
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lost_found_private'
  loop
    execute format('drop policy %I on public.lost_found_private', r.policyname);
  end loop;
end
$$;

create policy "임원만 분실물 비공개 정보 조회"
  on public.lost_found_private for select
  to authenticated
  using (public.is_officer());

create policy "임원만 분실물 비공개 정보 등록"
  on public.lost_found_private for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 분실물 비공개 정보 수정"
  on public.lost_found_private for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 분실물 비공개 정보 삭제"
  on public.lost_found_private for delete
  to authenticated
  using (public.is_officer());
