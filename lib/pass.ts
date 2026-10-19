/**
 * 입장권 공용 상수 · 명단 파싱.
 *
 * 로그인 API(쿠키) · 입장권 화면 · 관리 화면(명단 미리보기)과 명단 추가 API 가
 * 같은 규칙을 써야 해서 한곳에 모아둔다.
 */

/** 로그인 유지 쿠키 이름. 원래 토큰은 이 httpOnly 쿠키에만 있고 DB 에는 해시만 있다. */
export const PASS_COOKIE = "pass_token";

/** 로그인 유지 기간 180일(초). pass_login 이 만드는 세션 만료와 같은 값. */
export const PASS_COOKIE_MAX_AGE = 180 * 24 * 60 * 60;

/** 한 번에 붙여넣을 수 있는 최대 줄 수 */
export const MAX_ROSTER_LINES = 1000;

/** 명단 한 칸 최대 길이 */
export const ROSTER_LIMITS = { studentName: 20, studentNumber: 10 } as const;

export type RosterEntry = { studentNumber: string; studentName: string };

export type RosterError = {
  /** 1부터 세는 줄 번호 */
  line: number;
  text: string;
  reason: string;
};

/**
 * "학번 이름" 명단 붙여넣기를 읽는다. 한 줄에 1명.
 * - 구분자는 탭 · 공백 · 쉼표 모두 허용한다(구글 시트에서 두 칸을 복사하면 탭으로 온다).
 * - 칸이 정확히 2개여야 하고, 숫자로만 된 칸을 학번으로 본다(순서가 "이름 학번"이어도 된다).
 * - 빈 줄은 건너뛴다. 같은 학번이 두 번 나오면 첫 줄만 쓴다.
 */
export function parseRoster(text: string) {
  const entries: RosterEntry[] = [];
  const errors: RosterError[] = [];
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const cells = trimmed.split(/[\s,，]+/).filter(Boolean);
    const numberIndex = cells.findIndex((cell) => /^\d+$/.test(cell));

    if (cells.length !== 2 || numberIndex === -1 || /^\d+$/.test(cells[1 - numberIndex])) {
      errors.push({ line, text: trimmed, reason: "\"학번 이름\" 형식이 아니에요" });
      return;
    }

    const studentNumber = cells[numberIndex];
    const studentName = cells[1 - numberIndex];

    if (
      studentNumber.length > ROSTER_LIMITS.studentNumber ||
      studentName.length > ROSTER_LIMITS.studentName
    ) {
      errors.push({ line, text: trimmed, reason: "학번이나 이름이 너무 길어요" });
      return;
    }

    if (seen.has(studentNumber)) {
      errors.push({ line, text: trimmed, reason: "위에 같은 학번이 있어요" });
      return;
    }

    seen.add(studentNumber);
    entries.push({ studentNumber, studentName });
  });

  return { entries, errors };
}
