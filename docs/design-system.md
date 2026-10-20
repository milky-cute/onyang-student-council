# 디자인 시스템 (라운드 16-1)

토큰 정의는 `app/globals.css` 한 곳. 방향: 차분한 파랑 하나(brand) + 슬레이트 무채색, 색은 상태를 말할 때만.

## 토큰

| 종류 | 클래스 | 값 | 쓰임 |
| --- | --- | --- | --- |
| 글자 | `text-caption` | 12px | 캡션 · 배지 · 최소 크기 |
| | `text-body-sm` | 14px | 보조 글, 목록 설명 |
| | `text-body` | 16px | 본문, 버튼 |
| | `text-card-title` | 18px | 카드 제목 |
| | `text-title` | 22px | 페이지 · 섹션 제목, 홈 1순위 카드 제목 |
| | `text-display` | 28px | 숫자 강조 |
| 굵기 | `font-normal` / `font-semibold` / `font-bold` | 400 / 600 / 700 | 500 · 800 은 쓰지 않는다 |
| 모서리 | `rounded-chip` / `rounded-control` / `rounded-card` / `rounded-full` | 8 / 12 / 20 / 완전 둥글게 | 칩 · 입력 / 버튼 · 내부 패널 / 카드 / 배지 |
| 간격 | Tailwind 1 · 2 · 3 · 4 · 5 · 6 · 8 | 4 · 8 · 12 · 16 · 20 · 24 · 32px | x.5 단계는 아이콘 광학 보정에만 |
| 색 | `brand-50/100/600/700` | #EFF6FF / #DBEAFE / #2563EB / #1D4ED8 | 연한 바탕 / 구분선 / 호버 / 주색 |
| | `slate-900` / `slate-600` | 본문 / 보조 글자 | `slate-500` 은 #F5F7FA 위 4.43:1 이라 글자에 쓰지 않는다 |

## 공통 유틸리티 · 컴포넌트

- `card` — 흰 바탕 + 20px + 옅은 테두리 · 그림자.
- `icon-tile` — 40px, brand-50 바탕 + brand-700 아이콘. 다른 색 타일은 만들지 않는다.
- `btn` + `btn-primary` | `btn-outline` | `btn-ghost` — 높이 44px 이상. 크기 · 여백은 변형이 정한다.
- `badge` + `badge-active`(진행 · 신청 중) | `badge-info`(상시 등 보조) | `badge-soon`(마감 임박, amber) | `badge-muted`(예정 · 종료 · 마감) | `badge-ok`(성공 · 보관 중, green) | `badge-error`(오류, red).
- `SectionHeader` (`components/section-header.tsx`) — 카드 머리. `primary` 면 제목 22px, 아니면 18px. `action` 으로 "전체 보기".
- `ProjectBadges` — 사업 상태 배지. 신청 마감 3일 이내는 amber.

## hallmark 검토 (홈 · 공통 컴포넌트)

고친 것
- 모든 카드가 같은 크기 · 같은 무게 → 급식만 제목 22px · 여백 24px, 나머지는 18px · 20px.
- 무지개 아이콘 타일(보라 · 주황 · 초록 · 분홍) → brand 한 가지.
- 하단 탭과 같은 링크를 다시 보여주던 6칸 서비스 격자 → 탭에 없는 4개만 목록으로.
- 날짜가 맨 위 알약과 급식 카드에 두 번 → 맨 위 한 번만.
- 수능 D-day 가 D-day 카드와 "다가오는 일정" 목록에 두 번 → D-day 줄에만.
- 분실물 사진마다 붙은 "보관 중" 배지(홈엔 보관 중인 것만 나옴) → 제목 옆 "보관 중 N개" 하나로.
- 카드마다 다르던 링크 문구("더보기" / "전체 보기" / 아이콘만) → "전체 보기".

남긴 것
- 카드 머리마다 아이콘 타일 — 휴대폰에서 스크롤하며 카드를 구분하는 표지라 유지. 색은 하나로 통일.
- 일정 날짜 줄의 색 점 — 임원이 일정마다 고른 색(데이터)이라 장식 색이 아님.
- 푸터의 전체 메뉴 반복 — 범위 밖(16-2), 데스크톱 헤더 메뉴와 겹치는지 그때 판단.
- 문구 "학생의 목소리가 학교를 바꿉니다" — 내용 결정이라 그대로.
- 컴퓨터에서 분실물이 3개 미만이면 오른쪽이 빈다 — 사진 최대 240px 조건의 결과, 수용.

## 모션 (라운드 16-2)

| 이름 | 값 | 곡선 | 쓰인 곳 |
| --- | --- | --- | --- |
| `--motion-press` | 120ms | `ease-enter` | `btn` · `press` 의 :active scale(0.97) |
| `--motion-ui` | 200ms | `ease-move`(이동) / `ease-enter`(색) | 하단 탭 활성 막대 이동, 탭 글자색, 사진 슬라이드 활성 점, press 의 색 전환 |
| `--motion-enter` | 280ms | `ease-enter` | `animate-enter`(투명도 + 8px) · `animate-fade-in` — 더보기 시트, 사진 크게 보기, QR, 요구사항 조회 결과 · 제출 완료, 끝난 사업 더 보기 |
| `ease-enter` | cubic-bezier(0.23, 1, 0.32, 1) | | 등장 · 닫힘 |
| `ease-move` | cubic-bezier(0.65, 0, 0.35, 1) | | 위치 이동 |

- transform · opacity 만 움직인다. 카드 링크 · 버튼은 `press`(또는 `btn`) 하나로 누름 반응 + 색 전환을 함께 맡으니 `transition-colors` 와 같이 쓰지 않는다.
- 동작 줄이기(prefers-reduced-motion): `--motion-distance` 0, `--motion-press-scale` 1 → 투명도 전환만 남는다. 탭 막대 · 슬라이드 점은 `motion-reduce:` 로 이동 전환을 끈다.
- ⚠️ 입장권(`components/pass-card.tsx`)의 초 단위 시계와 흐르는 띠는 위조 방지 기능이라 동작 줄이기에서도 멈추지 않는다. 띠는 JS Web Animations 로 돌아 CSS 규칙과 무관하다. 전역 `animation: none` 규칙을 넣지 말 것.
- 포커스 링: `:focus-visible` 기본값이 brand-700 2px(globals.css base).

## 배지 규칙 추가 (16-2)

- 한 줄에 진한 파랑(`badge-active`)은 하나만. 사업 배지는 "신청 중"만 active, 진행중 · 상시는 `badge-info`, 입장권 · 예정 · 종료는 `badge-muted`.
- 손으로 만든 알약(rounded-full + px + text-caption)은 쓰지 않고 `badge` + 변형을 쓴다. 관리 화면 D-day 는 `badge-soon`, 정지 · 오류는 `badge-error`.

## hallmark 검토 (16-2, 나머지 공개 페이지)

고친 것
- 사업 · 분실물 상세에서 제목이 페이지 머리와 카드에 두 번 → 카드에는 배지만.
- 사업 카드 배지 줄에 진한 파랑이 2~3개(진행중 · 신청 중 · 입장권) → 신청 중 하나만.
- 사진 없는 사업의 보라 자리 표시, 입장권 버튼 · 안내문 · 분실물 "주웠다면" 안내의 노랑 → brand / slate.
- 페이지마다 다르던 배지 모양(rounded · rounded-md · rounded-full, 10~12px) → `badge` 하나.
- /requests/check 만 본문이 가운데 정렬(max-w-2xl mx-auto)이라 제목보다 안쪽 → 다른 하위 페이지처럼 제목 열 왼쪽에 맞춤.
- 아카이브 카드만 그림자로 hover → 다른 카드처럼 테두리 hover + press.
- 쓰이지 않게 된 brand-200/300/500/800/900 토큰 삭제(hover 는 brand-600).

남긴 것
- 입장권 시계 36px(`text-4xl`) — 토큰 최대 28px 보다 크지만, 검사하는 사람이 초가 넘어가는 걸 멀리서 확인하는 용도라 예외.
- 게시판 상세는 PageHeader 없이 가운데 정렬 기사형 — 제목 · 본문이 같은 열이라 어긋남이 없고, 바꾸면 레이아웃 재설계라 범위 밖.
- 푸터 전체 메뉴 — 데스크톱 헤더와 겹치지만 모바일에서는 하단 탭(4개) + 더보기 밖의 "임원 로그인" 경로가 푸터뿐이라 유지.
- 분실물 목록 "찾아감" 사진 위 알약(bg-slate-900/75) — 사진 위 겹침 표시라 상태 배지 색과 따로 둔다.
- 관리 화면 amber 안내(officers 미등록 경고, 입장권 명단 안내, 분실물 비공개 정보 칸) — 장식이 아닌 주의 상태라 유지. 관리 사진 삭제 버튼(24px)은 관리 화면 범위 밖.
