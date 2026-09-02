import Link from "next/link";

export default function BoardPostNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-slate-900">
        게시글을 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        삭제되었거나 주소가 잘못되었습니다.
      </p>
      <Link
        href="/board"
        className="mt-8 inline-block rounded-md bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
      >
        게시판으로 돌아가기
      </Link>
    </div>
  );
}
