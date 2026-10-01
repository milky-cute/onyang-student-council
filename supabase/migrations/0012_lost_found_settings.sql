-- =============================================================================
-- 분실물센터 — "찾으러 오는 법" 설정 (lost_found_settings)
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0001_initial_schema.sql 실행 이후. public.is_officer() 사용)
--
-- 보관 장소와 찾으러 올 수 있는 시간을 임원이 관리 화면에서 직접 고칠 수 있게
-- 한다. 설정은 사이트 전체에 하나뿐이라 행을 딱 하나(id = 1)만 둔다.
-- =============================================================================

create table if not exists public.lost_found_settings (
  id           smallint    primary key default 1 check (id = 1), -- 행 하나로 고정
  pickup_place text        not null,                              -- 보관 장소
  pickup_hours text        not null,                              -- 찾으러 올 수 있는 시간
  updated_at   timestamptz not null default now()
);

comment on table public.lost_found_settings is
  '분실물 "찾으러 오는 법" 안내 설정. 행은 id = 1 하나뿐이다. 조회는 누구나, 수정은 임원만.';

-- 초기값. 이미 행이 있으면(임원이 고친 값) 덮어쓰지 않는다.
insert into public.lost_found_settings (id, pickup_place, pickup_hours)
values (1, '학생회실', '점심시간')
on conflict (id) do nothing;


-- =============================================================================
-- Row Level Security
--
-- insert/delete 정책은 만들지 않는다 → RLS 가 켜져 있으니 누구도 행을 추가하거나
-- 지울 수 없고, 위의 초기 행 하나로 고정된다.
-- 수정은 애플리케이션(API 라우트)에서도 officers 테이블을 한 번 더 확인한다(이중 방어).
-- =============================================================================
alter table public.lost_found_settings enable row level security;

-- 이 파일을 다시 실행해도 "policy already exists" 로 막히지 않도록 먼저 지운다.
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lost_found_settings'
  loop
    execute format('drop policy %I on public.lost_found_settings', r.policyname);
  end loop;
end
$$;

create policy "누구나 분실물 안내 설정 조회"
  on public.lost_found_settings for select
  to anon, authenticated
  using (true);

create policy "임원만 분실물 안내 설정 수정"
  on public.lost_found_settings for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());
