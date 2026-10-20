"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** "다른 학생으로 로그인". 이 휴대폰의 입장권 로그인을 끊고 로그인 폼으로 돌아간다. */
export function PassLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await fetch("/api/pass/logout", { method: "POST" });
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="btn border border-slate-300 bg-white px-4 text-body-sm text-slate-700 hover:bg-slate-100"
    >
      {pending ? "로그아웃 중…" : "다른 학생으로 로그인"}
    </button>
  );
}
