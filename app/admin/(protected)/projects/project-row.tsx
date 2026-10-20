"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProjectBadges } from "@/components/project-badges";
import { ProjectQr } from "@/components/project-qr";
import { needsUnoptimized, type Project } from "@/lib/projects";

const outlineButton =
  "rounded-chip border border-slate-300 px-3 py-2 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60";

export function ProjectRow({
  project,
  coverUrl,
  pageUrl,
  todayKey,
}: {
  project: Project;
  coverUrl: string | null;
  /** 공개 상세 페이지 절대 주소(서버에서 SITE_URL 로 만든 값). 포스터 QR 에 들어간다. */
  pageUrl: string;
  todayKey: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handlePin() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !project.is_pinned }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "변경 중 문제가 발생했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("변경 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `"${project.title}" 을(를) 삭제할까요? 사진 · 링크 · 입장권 명단까지 함께 지워지고 되돌릴 수 없습니다.\n\n끝난 사업은 지우지 않아도 자동으로 "끝난 사업"에 보관됩니다.`,
      )
    ) {
      return;
    }

    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "삭제 중 문제가 발생했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(`복사하지 못했습니다. 직접 복사해주세요: ${pageUrl}`);
    }
  }

  const period = project.is_always
    ? "상시"
    : project.end_date && project.end_date !== project.start_date
      ? `${project.start_date} ~ ${project.end_date}`
      : project.start_date;

  return (
    <div className="flex flex-col gap-3 rounded-control border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          {coverUrl && (
            <div className="relative size-20 shrink-0 overflow-hidden rounded-chip bg-slate-100">
              <Image
                src={coverUrl}
                unoptimized={needsUnoptimized(coverUrl)}
                alt={project.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            <p className="flex flex-wrap items-center gap-2 text-body-sm font-semibold text-slate-900">
              {project.is_pinned && (
                <span className="badge badge-info">
                  고정
                </span>
              )}
              {project.title}
            </p>
            <ProjectBadges project={project} todayKey={todayKey} />
            <p className="text-caption text-slate-600">기간 {period}</p>
            {error && (
              <p role="alert" className="text-body-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handlePin} disabled={pending} className={outlineButton}>
            {project.is_pinned ? "고정 해제" : "상단 고정"}
          </button>
          <button
            type="button"
            onClick={() => setQrOpen((open) => !open)}
            aria-expanded={qrOpen}
            className={outlineButton}
          >
            {qrOpen ? "QR 닫기" : "QR 코드"}
          </button>
          {project.has_pass && (
            <Link href={`/admin/projects/${project.id}/pass`} className={outlineButton}>
              입장권 명단
            </Link>
          )}
          <Link
            href={`/admin/projects/${project.id}/edit`}
            className="rounded-control bg-brand-700 px-4 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            수정
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-chip border border-red-300 px-3 py-2 text-body-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            삭제
          </button>
        </div>
      </div>

      {qrOpen && (
        <div className="flex flex-col items-center gap-4 rounded-control bg-slate-50 px-4 py-4 sm:flex-row sm:items-start">
          <ProjectQr
            value={pageUrl}
            fileName={`${project.title}-QR.png`}
            alt={`${project.title} 사업 페이지 QR 코드`}
          />
          <div className="flex min-w-0 flex-col gap-2 text-body-sm">
            <p className="text-slate-600">
              포스터용 QR 이미지(1024px, 여백 포함)입니다. 아래 주소로 연결됩니다.
            </p>
            <p className="break-all rounded-control border border-slate-200 bg-white px-3 py-2 font-mono text-caption text-slate-800">
              {pageUrl}
            </p>
            <button type="button" onClick={handleCopy} className={`${outlineButton} self-start bg-white`}>
              {copied ? "복사됨" : "주소 복사"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
