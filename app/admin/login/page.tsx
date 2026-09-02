import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "임원 로그인",
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-20">
      <h1 className="text-2xl font-bold text-slate-900">임원 로그인</h1>
      <p className="mt-2 text-sm text-slate-600">
        학생회 임원에게 발급된 계정으로 로그인하세요.
      </p>

      {/* useSearchParams 를 쓰는 폼이라 Suspense 경계가 필요하다. */}
      <Suspense fallback={<div className="mt-8 h-64" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
