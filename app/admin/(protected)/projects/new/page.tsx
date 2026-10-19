import type { Metadata } from "next";

import { AdminBackLink } from "@/components/admin-back-link";

import { ProjectForm } from "../project-form";

export const metadata: Metadata = {
  title: "사업 등록",
};

export default function NewProjectPage() {
  return (
    <>
      <AdminBackLink href="/admin/projects" />
      <h1 className="text-2xl font-bold text-slate-900">사업 등록</h1>
      <div className="mt-8">
        <ProjectForm />
      </div>
    </>
  );
}
