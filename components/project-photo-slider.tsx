"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { needsUnoptimized } from "@/lib/projects";

/**
 * 사업 사진 슬라이드. 가로로 넘기는 scroll-snap + 아래 점 표시(라이브러리 없음).
 * 포스터가 잘리지 않도록 object-contain 으로 띄운다.
 */
export function ProjectPhotoSlider({
  photos,
  title,
  ended,
}: {
  photos: string[];
  title: string;
  /** 끝난 사업 — 흑백 + 약간 투명 */
  ended: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative bg-slate-100">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((url, index) => (
          <div
            key={url}
            className="relative aspect-[4/5] max-h-[70vh] w-full shrink-0 snap-center sm:aspect-[4/3]"
          >
            <Image
              src={url}
              unoptimized={needsUnoptimized(url)}
              alt={photos.length > 1 ? `${title} 사진 ${index + 1}` : title}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              preload={index === 0}
              className={`object-contain ${ended ? "opacity-70 grayscale" : ""}`}
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex justify-center">
          <div className="flex items-center rounded-full bg-slate-900/40 px-1">
            {photos.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`사진 ${index + 1} 보기`}
                aria-current={index === active}
                className="flex size-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-white"
              >
                <span
                  className={`block rounded-full transition-all ${
                    index === active ? "h-2 w-4 bg-white" : "size-2 bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
