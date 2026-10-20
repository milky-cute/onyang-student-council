/**
 * supabase/migrations/*.sql 과 1:1로 대응하는 수동 타입 정의.
 *
 * 스키마를 바꿨다면 아래 명령으로 다시 생성해 이 파일을 덮어써도 된다.
 *   npx supabase gen types typescript --project-id <PROJECT_REF> > lib/supabase/database.types.ts
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 *    (스키마 변경이 필요하면 main 에 새 마이그레이션을 추가한 뒤 함께 갱신)
 */

/** board_posts.type */
export type BoardPostType = "notice" | "poster";

/** requests.status */
export type RequestStatus = "대기" | "답변완료";

export type Officer = {
  /** auth.users.id 와 동일한 값 */
  id: string;
  email: string;
  name: string;
  department: string | null;
  /** 'president' | 'vice' | 'department_head' | 'member' 등 자유 문자열 */
  role: string;
  created_at: string;
};

export type BoardPost = {
  id: string;
  type: BoardPostType;
  title: string;
  content: string | null;
  image_url: string | null;
  /** 목록 상단 고정 여부 (0003_board_posts_pinned.sql) */
  is_pinned: boolean;
  /** 작성 시점 담당 임원의 부서 스냅샷. null 이면 화면에서 "학생자치회"로 표시 (0006) */
  department: string | null;
  author_id: string | null;
  created_at: string;
};

export type MonthlyActivity = {
  id: string;
  /** 'YYYY-MM' 형식 */
  year_month: string;
  department: string;
  title: string;
  description: string | null;
  image_url: string | null;
  author_id: string | null;
  created_at: string;
};

export type ArchivePhoto = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  album: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type StudentRequest = {
  id: string;
  student_name: string;
  student_number: string;
  /** bcrypt 해시. 클라이언트로 절대 내려가지 않는다. */
  pin_hash: string;
  title: string;
  category: string | null;
  content: string;
  status: RequestStatus;
  answer: string | null;
  answered_by: string | null;
  /** 답변 시점 담당 임원의 부서 스냅샷. null 이면 화면에서 "학생자치회"로 표시 (0006) */
  answered_department: string | null;
  /** 답변완료된 글을 get_public_requests() 로 공개할지 여부 (0006) */
  is_public: boolean;
  created_at: string;
  answered_at: string | null;
};

/** get_my_requests() 가 돌려주는 행 (pin_hash·개인정보 제외) */
export type MyRequest = Pick<
  StudentRequest,
  | "id"
  | "title"
  | "category"
  | "content"
  | "status"
  | "answer"
  | "answered_department"
  | "created_at"
  | "answered_at"
>;

/** get_public_requests() 가 돌려주는 행 (답변완료 + 공개된 것만, 학생 개인정보 제외) */
export type PublicRequest = Pick<
  StudentRequest,
  | "id"
  | "title"
  | "category"
  | "content"
  | "answer"
  | "answered_department"
  | "created_at"
  | "answered_at"
>;

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  /** 'YYYY-MM-DD' 형식 (Postgres date, 0004_calendar.sql) */
  event_date: string;
  /** '#rrggbb' 형식의 표시 색상 (0005_calendar_event_color.sql) */
  color: string;
  /** 홈 화면 D-day 표시 대상 여부 (0007_calendar_dday_and_my_requests_department.sql) */
  is_dday: boolean;
  /** 학생회 사업에서 자동으로 만든 일정이면 그 사업 id, 직접 등록한 일정은 null (0014_project_calendar_sync.sql) */
  project_id: string | null;
  author_id: string | null;
  created_at: string;
};

/** 분실물센터 습득물. 등록은 임원만, 조회는 누구나 (0010_lost_found_admin.sql) */
export type LostFoundItem = {
  id: string;
  /** 물품 이름 (예: '검정색 우산') */
  title: string;
  description: string | null;
  /** 습득 장소 — 어디서 주웠는지 */
  location: string;
  /** 보관 장소 — 주인이 찾으러 갈 곳 */
  storage_location: string;
  image_url: string | null;
  /** 주인이 찾아갔는지 여부 */
  is_resolved: boolean;
  created_at: string;
};

/**
 * 분실물의 임원 전용 정보. 조회도 임원만 가능 (0011_lost_found_private.sql)
 * 공개 페이지에서는 절대 조회하지 않는다.
 */
export type LostFoundPrivate = {
  /** lost_found_items.id (삭제 시 함께 삭제) */
  item_id: string;
  /** 주인 확인용 특징 (예: 케이스 스티커, 흠집 위치) */
  private_note: string | null;
  /** 받아간 사람 (이름·학번) */
  claimed_by: string | null;
  claimed_at: string | null;
};

/** 분실물 "찾으러 오는 법" 설정. 행은 id = 1 하나뿐 (0012_lost_found_settings.sql) */
export type LostFoundSettings = {
  /** 항상 1 */
  id: number;
  /** 보관 장소 */
  pickup_place: string;
  /** 찾으러 올 수 있는 시간 */
  pickup_hours: string;
  updated_at: string;
};

/** 학생회 사업. 상태는 날짜로 계산한다(lib/projects.ts). 조회는 누구나, 쓰기는 임원 (0013) */
export type Project = {
  id: string;
  title: string;
  /** 한 줄 소개 */
  summary: string | null;
  description: string;
  /** 상시 사업 */
  is_always: boolean;
  /** 'YYYY-MM-DD'. 상시가 아니면 필수 */
  start_date: string | null;
  /** 'YYYY-MM-DD'. 비우면 시작일 하루 */
  end_date: string | null;
  /** 신청 시작일 'YYYY-MM-DD' */
  apply_start: string | null;
  /** 신청 마감일 'YYYY-MM-DD' */
  apply_end: string | null;
  target: string | null;
  place: string | null;
  contact: string | null;
  /** 입장권 사용 여부 */
  has_pass: boolean;
  /** 입장권 이름. 비우면 '{제목} 입장권' */
  pass_label: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

/** 사업 사진. sort_order 가 가장 작은 것이 대표 사진 (0013) */
export type ProjectPhoto = {
  id: string;
  project_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

/** project_links.kind — 'apply'(신청 기간 규칙을 따름) | 'other' */
export type ProjectLinkKind = "apply" | "other";

/** 사업 링크 (신청 구글폼, 오픈채팅 등) (0013) */
export type ProjectLink = {
  id: string;
  project_id: string;
  /** 버튼 이름 */
  label: string;
  /** https:// 로 시작 */
  url: string;
  kind: ProjectLinkKind;
  /** 상세 페이지에서 QR 로도 보여주기 */
  show_qr: boolean;
  sort_order: number;
  created_at: string;
};

/** 사업별 입장권 명단. 임원만 접근 (0013) */
export type PassHolder = {
  id: string;
  project_id: string;
  student_number: string;
  student_name: string;
  is_suspended: boolean;
  created_at: string;
};

/** 학번별 입장권 PIN (모든 사업 공통). 임원은 조회·삭제만 (0013) */
export type PassCredential = {
  student_number: string;
  student_name: string;
  /** bcrypt 해시. 클라이언트로 절대 내려가지 않는다. */
  pin_hash: string;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
};

/** 입장권 로그인 세션. 토큰의 sha256 해시만 저장. 임원은 조회·삭제만 (0013) */
export type PassSession = {
  token_hash: string;
  student_number: string;
  created_at: string;
  expires_at: string;
};

/** pass_login() 이 돌려주는 행. 명단에 없거나 PIN 이 틀리면 token 이 null */
export type PassLoginRow = {
  token: string | null;
  is_new_pin: boolean | null;
};

/** pass_status() 가 돌려주는 행. 세션이 없거나 만료되면 행이 없다. */
export type PassStatusRow = {
  student_name: string;
  student_number: string;
  /** 이 사업 명단에 있는지 */
  is_listed: boolean;
  is_suspended: boolean;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  /** supabase-js 가 조인 추론에 쓰는 필드. 조인을 쓰지 않으므로 비워둔다. */
  Relationships: [];
};

/** DB 가 채워주는 컬럼(id·created_at 등)을 Insert 에서 선택값으로 만든다. */
type Generated<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Database = {
  public: {
    Tables: {
      officers: Table<
        Officer,
        Generated<Officer, "created_at" | "role">,
        Partial<Officer>
      >;
      board_posts: Table<
        BoardPost,
        Generated<BoardPost, "id" | "created_at" | "is_pinned">,
        Partial<BoardPost>
      >;
      monthly_activities: Table<
        MonthlyActivity,
        Generated<MonthlyActivity, "id" | "created_at">,
        Partial<MonthlyActivity>
      >;
      archive_photos: Table<
        ArchivePhoto,
        Generated<ArchivePhoto, "id" | "created_at">,
        Partial<ArchivePhoto>
      >;
      requests: Table<
        StudentRequest,
        Generated<StudentRequest, "id" | "created_at" | "status" | "is_public">,
        Partial<StudentRequest>
      >;
      calendar_events: Table<
        CalendarEvent,
        Generated<CalendarEvent, "id" | "created_at" | "color" | "is_dday" | "project_id">,
        Partial<CalendarEvent>
      >;
      lost_found_items: Table<
        LostFoundItem,
        Generated<LostFoundItem, "id" | "created_at" | "is_resolved">,
        Partial<LostFoundItem>
      >;
      lost_found_private: Table<
        LostFoundPrivate,
        Generated<LostFoundPrivate, "private_note" | "claimed_by" | "claimed_at">,
        Partial<LostFoundPrivate>
      >;
      lost_found_settings: Table<
        LostFoundSettings,
        Generated<LostFoundSettings, "id" | "updated_at">,
        Partial<LostFoundSettings>
      >;
      projects: Table<
        Project,
        Generated<
          Project,
          "id" | "created_at" | "updated_at" | "is_always" | "has_pass" | "is_pinned"
        >,
        Partial<Project>
      >;
      project_photos: Table<
        ProjectPhoto,
        Generated<ProjectPhoto, "id" | "created_at" | "sort_order">,
        Partial<ProjectPhoto>
      >;
      project_links: Table<
        ProjectLink,
        Generated<ProjectLink, "id" | "created_at" | "sort_order" | "kind" | "show_qr">,
        Partial<ProjectLink>
      >;
      pass_holders: Table<
        PassHolder,
        Generated<PassHolder, "id" | "created_at" | "is_suspended">,
        Partial<PassHolder>
      >;
      pass_credentials: Table<
        PassCredential,
        Generated<PassCredential, "created_at" | "failed_attempts" | "locked_until">,
        Partial<PassCredential>
      >;
      pass_sessions: Table<
        PassSession,
        Generated<PassSession, "created_at">,
        Partial<PassSession>
      >;
    };
    Views: Record<never, never>;
    Functions: {
      is_officer: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      submit_request: {
        Args: {
          p_student_name: string;
          p_student_number: string;
          p_pin: string;
          p_title: string;
          p_category: string | null;
          p_content: string;
        };
        Returns: string;
      };
      get_my_requests: {
        Args: {
          p_student_name: string;
          p_student_number: string;
          p_pin: string;
        };
        Returns: MyRequest[];
      };
      get_public_requests: {
        Args: Record<string, never>;
        Returns: PublicRequest[];
      };
      pass_login: {
        Args: {
          p_name: string;
          p_number: string;
          p_pin: string;
        };
        Returns: PassLoginRow[];
      };
      pass_status: {
        Args: {
          p_token: string;
          p_project_id: string;
        };
        Returns: PassStatusRow[];
      };
      pass_logout: {
        Args: {
          p_token: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
