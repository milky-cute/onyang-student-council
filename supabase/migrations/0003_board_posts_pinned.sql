-- =============================================================================
-- board_posts 상단 고정 기능
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0001_initial_schema.sql 실행 이후 언제든 실행 가능)
--
-- 목록 정렬은 is_pinned desc → created_at desc 순서라
-- 고정된 글이 항상 맨 위에, 나머지는 최신순으로 나온다.
-- =============================================================================

alter table public.board_posts
  add column if not exists is_pinned boolean not null default false;

comment on column public.board_posts.is_pinned is
  '학생회 게시판 목록에서 상단에 고정할지 여부. 임원이 글 단위로 켜고 끈다.';

-- 고정된 글은 소수라 부분 인덱스로 충분하다.
create index if not exists board_posts_pinned_idx
  on public.board_posts (created_at desc)
  where is_pinned;
