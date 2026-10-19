import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminBackLink } from "@/components/admin-back-link";
import { createClient } from "@/lib/supabase/server";

import { ProjectForm } from "../../project-form";

export const metadata: Metadata = {
  title: "사업 수정",
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: photos }, { data: links }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("project_photos")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_links")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <>
      <AdminBackLink href="/admin/projects" />
      <h1 className="text-2xl font-bold text-slate-900">사업 수정</h1>
      <div className="mt-8">
        <ProjectForm project={{ ...project, photos: photos ?? [], links: links ?? [] }} />
      </div>
    </>
  );
}
