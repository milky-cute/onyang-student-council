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
        Generated<CalendarEvent, "id" | "created_at" | "color" | "is_dday">,
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
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
