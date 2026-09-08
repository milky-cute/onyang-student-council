/**
 * 사이트 전역 상수. 학교명 / 네비게이션 메뉴의 단일 출처(single source of truth).
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 *    (메뉴 구조 변경이 필요하면 main 에서 별도로 논의)
 */

export const SITE = {
  schoolName: "온양고등학교",
  councilName: "학생자치회",
  fullName: "온양고등학교 학생자치회",
  description:
    "온양고등학교 학생자치회의 공지사항, 부서별 활동, 활동 사진, 학생 요구사항을 한곳에서 확인할 수 있는 공식 웹사이트입니다.",
} as const;

export type NavItem = {
  /** 라우트 경로 */
  href: string;
  /** 네비게이션에 표시되는 이름 */
  label: string;
  /** 페이지 상단 배너와 홈 카드에 함께 쓰이는 한 줄 설명 */
  description: string;
};

/** 헤더 · 모바일 메뉴 · 홈 카드가 공유하는 메뉴 정의 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/board",
    label: "학생자치회 게시판",
    description: "진행중인 활동 포스터와 학생자치회 공지사항을 확인하세요.",
  },
  {
    href: "/monthly",
    label: "이달의 학생자치회",
    description: "매월 각 부서가 어떤 활동을 했는지 정리해 보여드립니다.",
  },
  {
    href: "/archive",
    label: "아카이브",
    description: "지난 학생자치회 활동 사진을 앨범별로 모아두었습니다.",
  },
  {
    href: "/requests",
    label: "요구사항",
    description: "학교에 바라는 점을 남기고, 답변을 확인할 수 있습니다.",
  },
  {
    href: "/calendar",
    label: "일정",
    description: "학생자치회가 등록한 학사일정과 행사를 달력으로 확인하세요.",
  },
  {
    href: "/lost-found",
    label: "분실물센터",
    description: "학생자치회가 보관 중인 분실물을 확인하고 찾아가세요.",
  },
];
