import { SectionHeader } from "@/components/section-header";
import { UtensilsIcon } from "@/components/icons";
import type { MealResult } from "@/lib/meal";

/**
 * 홈 화면 "오늘의 급식" 카드 — 홈의 1순위라 제목 22px · 여백 24px 로 다른 카드보다 한 단계 크게 둔다.
 * 학생이 가장 궁금해하는 중식을 옅은 파란 상자에 크게, 석식은 아래에 전체 메뉴를 줄바꿈해 붙인다(조식은 뺀다).
 * 날짜는 홈 맨 위에 크게 있으므로 여기서는 다시 쓰지 않는다.
 */
export function TodayMealCard({ meal }: { meal: MealResult }) {
  const meals = meal.status === "ok" ? meal.meals : [];
  const primary = meals.find((m) => m.name === "중식") ?? meals[0];
  const others = meals.filter((m) => m !== primary && m.name !== "조식");

  return (
    <section aria-labelledby="today-meal-heading" className="card flex h-full flex-col p-6">
      <SectionHeader id="today-meal-heading" title="오늘의 급식" icon={<UtensilsIcon />} primary>
        {primary?.calories && <span className="badge badge-muted">{primary.calories}</span>}
      </SectionHeader>

      {primary ? (
        <>
          <div className="mt-5 rounded-control bg-brand-50 p-4">
            <span className="badge badge-active">{primary.name}</span>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-body font-semibold text-slate-900">
              {primary.dishes.map((dish, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span aria-hidden className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-brand-700" />
                  {dish}
                </li>
              ))}
            </ul>
          </div>

          {others.map((m) => (
            <div key={m.name} className="mt-4 flex items-start gap-2 px-1">
              <span className="badge badge-muted shrink-0">{m.name}</span>
              <p className="min-w-0 text-body-sm/6 text-slate-700">{m.dishes.join(" · ")}</p>
            </div>
          ))}
        </>
      ) : (
        <p className="mt-5 rounded-control bg-slate-50 px-4 py-6 text-center text-body-sm text-slate-600">
          {meal.status === "empty"
            ? "오늘은 급식이 없는 날이에요."
            : "급식 정보를 불러오지 못했어요. 잠시 후 다시 확인해주세요."}
        </p>
      )}

      <p className="mt-auto pt-4 text-right text-caption text-slate-600">자료: 나이스 교육정보 개방 포털</p>
    </section>
  );
}
