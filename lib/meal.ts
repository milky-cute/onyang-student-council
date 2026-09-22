/**
 * 나이스(NEIS) 교육정보 개방 포털의 급식 식단 조회.
 *
 * 외부 API 를 서버에서 직접 부르고 fetch 캐시로 호출 수를 줄인다(DB 저장 없음).
 * 어떤 경우에도 예외를 던지지 않고 status 로 결과를 알려준다 — 급식 조회가
 * 실패했다고 홈 화면 전체가 500 이 나면 안 되기 때문이다.
 */

const NEIS_MEAL_URL = "https://open.neis.go.kr/hub/mealServiceDietInfo";
const OFFICE_CODE = "N10"; // 충청남도교육청
const SCHOOL_CODE = "8140061"; // 온양고등학교

/** 캐시 주기(초). 식단은 전날 올라오고 하루 중에는 거의 바뀌지 않는다. */
const REVALIDATE_SECONDS = 3600;
/** NEIS 가 느릴 때 홈 화면이 같이 멈추지 않도록 기다리는 상한(ms). */
const TIMEOUT_MS = 3000;

export type Meal = {
  /** '조식' | '중식' | '석식' */
  name: string;
  /** 알레르기 코드를 뗀 요리 이름 */
  dishes: string[];
  /** 예: '1245.9 Kcal' */
  calories: string | null;
};

export type MealResult =
  | { status: "ok"; meals: Meal[] }
  /** 급식이 없는 날(주말 · 방학 · 휴일) */
  | { status: "empty" }
  /** NEIS 호출 실패 또는 알 수 없는 응답 */
  | { status: "error" };

type NeisRow = {
  MMEAL_SC_CODE: string;
  MMEAL_SC_NM: string;
  DDISH_NM: string;
  CAL_INFO?: string;
};

type NeisResponse = {
  // 급식이 없는 날은 mealServiceDietInfo 없이 이 최상위 RESULT 만 온다.
  //   {"RESULT":{"CODE":"INFO-200","MESSAGE":"해당하는 데이터가 없습니다."}}
  RESULT?: { CODE?: string };
  mealServiceDietInfo?: Array<{
    head?: Array<{ RESULT?: { CODE?: string } }>;
    row?: NeisRow[];
  }>;
};

/** '자장면 (5.6.13)<br/>추가밥(찹쌀밥) ' → ['자장면', '추가밥(찹쌀밥)'] */
function parseDishes(ddishNm: string) {
  return (
    ddishNm
      .split(/<br\s*\/?>/i)
      // 알레르기 코드는 숫자와 점만 든 괄호다. '추가밥(찹쌀밥)' 같은 괄호는 남긴다.
      .map((dish) => dish.replace(/\s*\([\d.\s]+\)\s*$/, "").trim())
      .filter(Boolean)
  );
}

/** dateKey('YYYY-MM-DD') 날짜의 급식. 한국 시간 기준 날짜는 seoulToday() 로 구해 넘긴다. */
export async function getMeal(dateKey: string): Promise<MealResult> {
  const params = new URLSearchParams({
    ATPT_OFCDC_SC_CODE: OFFICE_CODE,
    SD_SCHUL_CODE: SCHOOL_CODE,
    MLSV_YMD: dateKey.replace(/-/g, ""),
    Type: "json",
  });
  // 키 없이도 조회되지만, 발급받은 키가 설정돼 있으면 함께 보낸다.
  if (process.env.NEIS_API_KEY) {
    params.set("KEY", process.env.NEIS_API_KEY);
  }

  try {
    const res = await fetch(`${NEIS_MEAL_URL}?${params}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("NEIS 급식 조회 실패: HTTP", res.status);
      return { status: "error" };
    }

    const data = (await res.json()) as NeisResponse;
    const [info, body] = data.mealServiceDietInfo ?? [];
    const code = data.RESULT?.CODE ?? info?.head?.[1]?.RESULT?.CODE;

    if (code === "INFO-200") {
      return { status: "empty" };
    }
    if (!body?.row) {
      // 인증키 오류 · 호출 제한 등 급식 데이터가 아닌 응답
      console.error("NEIS 급식 조회 실패: 응답 코드", code);
      return { status: "error" };
    }

    const meals = [...body.row]
      .sort((a, b) => Number(a.MMEAL_SC_CODE) - Number(b.MMEAL_SC_CODE))
      .map((row) => ({
        name: row.MMEAL_SC_NM,
        dishes: parseDishes(row.DDISH_NM),
        calories: row.CAL_INFO?.trim() || null,
      }))
      .filter((meal) => meal.dishes.length > 0);

    return meals.length > 0 ? { status: "ok", meals } : { status: "empty" };
  } catch (error) {
    // 네트워크 오류 · 타임아웃 · JSON 파싱 실패
    console.error("NEIS 급식 조회 실패:", error);
    return { status: "error" };
  }
}
