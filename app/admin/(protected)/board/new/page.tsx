import type { Metadata } from "next";

import { BoardForm } from "../board-form";

export const metadata: Metadata = {
  title: "새 글 작성",
};

export default function NewBoardPostPage() {
  return (
    <>
      <h1 className="text-title font-bold text-slate-900">새 글 작성</h1>
      <div className="mt-8">
        <BoardForm />
      </div>
    </>
  );
}
