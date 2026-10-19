"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** 파일 이름에 쓸 수 없는 글자를 뺀다. */
function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "").trim() || "QR.png";
}

/**
 * 주소를 QR 이미지로 보여주고 PNG 로 내려받게 한다(브라우저에서 생성, 서버 왕복 없음).
 *
 * 내려받는 이미지는 1024px + 여백(quiet zone) 포함이라 포스터에 그대로 넣어도 된다.
 * 화면에 보이는 것도 같은 이미지를 줄여서 띄운다.
 */
export function ProjectQr({
  value,
  fileName,
  alt,
}: {
  /** QR 에 담을 주소 */
  value: string;
  /** 내려받을 파일 이름. 예: '스터디룸-QR.png' */
  fileName: string;
  alt: string;
}) {
  const [qr, setQr] = useState<{ value: string; dataUrl: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: 1024, margin: 4, errorCorrectionLevel: "M" })
      .then((dataUrl) => {
        if (!cancelled) setQr({ value, dataUrl });
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  // 주소가 바뀐 직후에는 이전 QR 을 보여주지 않는다.
  const dataUrl = qr?.value === value ? qr.dataUrl : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex size-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
        {dataUrl ? (
          // data: URL 이라 next/image 최적화가 필요 없다.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={alt} width={192} height={192} className="size-full" />
        ) : (
          <span className="text-xs text-slate-500">QR 만드는 중…</span>
        )}
      </div>
      {dataUrl && (
        <a
          href={dataUrl}
          download={safeFileName(fileName)}
          className="flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          QR 이미지 저장
        </a>
      )}
    </div>
  );
}
