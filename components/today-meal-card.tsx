import { UtensilsIcon } from "@/components/icons";
import { dateLabel } from "@/lib/calendar-utils";
import type { MealResult } from "@/lib/meal";

/**
 * 홈 화면 "오늘의 급식" 카드.
 * 학생이 가장 궁금해하는 중식을 옅은 파란 상자에 크게, 석식은 아래 한 줄로 붙인다(조식은 뺀다).
 */
export function TodayMealCard({ dateKey, meal }: { dateKey: string; meal: MealResult }) {
  const meals = meal.status === "ok" ? meal.meals : [];
  const primary = meals.find((m) => m.name === "중식") ?? meals[0];
  const others = meals.filter((m) => m !== primary && m.name !== "조식");

  return (
    <section aria-labelledby="today-meal-heading" className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <UtensilsIcon />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
          <h2 id="today-meal-heading" className="text-lg font-bold text-slate-900">
            오늘의 급식
          </h2>
          <p className="text-sm text-slate-500">{dateLabel(dateKey)}</p>
        </div>
        {primary?.calories && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            {primary.calories}
          </span>
        )}
      </div>

      {primary ? (
        <>
          <div className="mt-4 rounded-xl bg-brand-50 px-4 py-4">
            <span className="rounded-md bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white">
              {primary.name}
            </span>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[15px] font-medium text-slate-900">
              {primary.dishes.map((dish, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span aria-hidden className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-brand-700" />
                  {dish}
                </li>
              ))}
            </ul>
          </div>

          {others.map((m) => (
            <div key={m.name} className="mt-3 flex items-center gap-2 px-1">
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {m.name}
              </span>
              <p className="min-w-0 truncate text-sm text-slate-700" title={m.dishes.join(" · ")}>
                {m.dishes.join(" · ")}
              </p>
            </div>
          ))}
        </>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          {meal.status === "empty"
            ? "오늘은 급식이 없는 날이에요."
            : "급식 정보를 불러오지 못했어요. 잠시 후 다시 확인해주세요."}
        </p>
      )}

      <p className="mt-auto pt-4 text-right text-[11px] text-slate-500">자료: 나이스 교육정보 개방 포털</p>
    </section>
  );
}
