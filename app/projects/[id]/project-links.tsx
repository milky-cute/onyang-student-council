"use client";

import { useState } from "react";

import { ProjectQr } from "@/components/project-qr";
import type { ProjectLinkKind } from "@/lib/projects";

export type LinkButton = {
  id: string;
  label: string;
  url: string;
  kind: ProjectLinkKind;
  showQr: boolean;
  /** 지금 열 수 있는지(서버에서 isLinkEnabled 로 계산) */
  enabled: boolean;
  /** 비활성일 때 버튼 문구. 예: '신청 마감', '10월 20일부터 신청' */
  disabledLabel: string;
};

const buttonBase =
  "flex min-h-14 w-full items-center justify-center rounded-control px-5 text-body font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

/**
 * 사업 링크 버튼 목록. '신청' 링크는 주색 버튼, '기타' 링크는 흰 바탕 테두리 버튼.
 * "QR로도 보여주기"가 켜진 링크는 버튼 아래 QR 토글을 둔다(컴퓨터 화면을 친구 폰으로 찍는 용도).
 */
export function ProjectLinks({ links }: { links: LinkButton[] }) {
  const [openQr, setOpenQr] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-3">
      {links.map((link) => {
        const qrOpen = openQr === link.id;
        return (
          <li key={link.id} className="flex flex-col gap-2">
            {link.enabled ? (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonBase} ${
                  link.kind === "apply"
                    ? "bg-brand-700 text-white hover:bg-brand-600"
                    : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </a>
            ) : (
              <span aria-disabled className={`${buttonBase} cursor-not-allowed bg-slate-100 text-slate-600`}>
                {link.disabledLabel}
              </span>
            )}

            {link.enabled && link.showQr && (
              <>
                <button
                  type="button"
                  onClick={() => setOpenQr(qrOpen ? null : link.id)}
                  aria-expanded={qrOpen}
                  className="flex min-h-11 items-center justify-center self-center rounded-chip px-3 text-body-sm font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700"
                >
                  {qrOpen ? "QR 닫기" : "QR 보기"}
                </button>
                {qrOpen && (
                  <div className="rounded-control bg-slate-50 px-4 py-4">
                    <ProjectQr
                      value={link.url}
                      fileName={`${link.label}-QR.png`}
                      alt={`${link.label} 주소 QR 코드`}
                    />
                  </div>
                )}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
