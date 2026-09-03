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
  | "created_at"
  | "answered_at"
>;

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  /** 'YYYY-MM-DD' 형식 (Postgres date, 0004_calendar.sql) */
  event_date: string;
  author_id: string | null;
  created_at: string;
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
        Generated<StudentRequest, "id" | "created_at" | "status">,
        Partial<StudentRequest>
      >;
      calendar_events: Table<
        CalendarEvent,
        Generated<CalendarEvent, "id" | "created_at">,
        Partial<CalendarEvent>
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
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
