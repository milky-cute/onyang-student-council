/**
 * 하위 페이지 상단의 제목 배너.
 *
 * 2단계에서 각 feature 브랜치가 이 컴포넌트를 **가져다 쓰기만** 하면
 * 두 브랜치의 페이지 디자인이 서로 어긋나지 않는다. (수정 금지)
 */
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-brand-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}
