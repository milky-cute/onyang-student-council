import type { Metadata } from "next";

import { MonthlyForm } from "../monthly-form";

export const metadata: Metadata = {
  title: "활동 등록",
};

export default function NewMonthlyActivityPage() {
  return (
    <>
      <h1 className="text-title font-bold text-slate-900">활동 등록</h1>
      <div className="mt-8">
        <MonthlyForm />
      </div>
    </>
  );
}
