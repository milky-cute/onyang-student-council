import { WEEKDAYS } from "@/lib/calendar-utils";
import type { MealResult } from "@/lib/meal";

/**
 * 홈 화면 "오늘의 급식" 카드.
 * 학생이 가장 궁금해하는 중식을 크게 보여주고, 조식 · 석식은 아래에 작게 붙인다.
 */
export function TodayMealCard({ dateKey, meal }: { dateKey: string; meal: MealResult }) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

  const meals = meal.status === "ok" ? meal.meals : [];
  const primary = meals.find((m) => m.name === "중식") ?? meals[0];
  const others = meals.filter((m) => m !== primary && m.name !== "조식");

  return (
    <section
      aria-labelledby="today-meal-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="today-meal-heading" className="text-lg font-bold text-slate-900">
          오늘의 급식
        </h2>
        <p className="text-sm text-slate-500">
          {month}월 {day}일 ({weekday})
        </p>
      </div>

      {primary ? (
        <>
          <div className="mt-4 rounded-lg bg-brand-50 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                {primary.name}
              </span>
              {primary.calories && (
                <span className="text-xs text-slate-500">{primary.calories}</span>
              )}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[15px] font-medium text-slate-900">
              {primary.dishes.map((dish, i) => (
                <li key={i}>{dish}</li>
              ))}
            </ul>
          </div>

          {others.map((m) => (
            <div key={m.name} className="mt-3 px-1">
              <p className="text-xs font-semibold text-slate-500">
                {m.name}
                {m.calories && ` · ${m.calories}`}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {m.dishes.join(" · ")}
              </p>
            </div>
          ))}
        </>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          {meal.status === "empty"
            ? "오늘은 급식이 없는 날이에요."
            : "급식 정보를 불러오지 못했어요. 잠시 후 다시 확인해주세요."}
        </p>
      )}

      <p className="mt-4 text-right text-[11px] text-slate-400">자료: 나이스 교육정보 개방 포털</p>
    </section>
  );
}
