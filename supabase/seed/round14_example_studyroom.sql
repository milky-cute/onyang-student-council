-- =============================================================================
-- 예시 사업: 스터디룸 사업 (상시, 입장권 사용)
--
-- 실행 방법: 0013_projects_and_passes.sql 실행 이후 SQL Editor 에 붙여넣고 Run.
--            같은 제목의 사업이 이미 있으면 아무것도 넣지 않는다(다시 실행해도 안전).
-- 이용 시간·규칙·링크(구글폼·카톡방)는 임원이 관리 화면에서 채운다.
-- 대표 사진은 임시로 학생회 로고를 쓴다.
-- =============================================================================

with new_project as (
  insert into public.projects (title, description, is_always, has_pass, pass_label)
  select '스터디룸 사업',
         '스터디룸 입장권을 보여주면 스터디룸에 입실할 수 있어요.',
         true,
         true,
         '스터디룸 입장권'
  where not exists (
    select 1 from public.projects where title = '스터디룸 사업'
  )
  returning id
)
insert into public.project_photos (project_id, image_url, sort_order)
select id, 'https://onyang-student-council.vercel.app/logo.jpg', 0
from new_project;
