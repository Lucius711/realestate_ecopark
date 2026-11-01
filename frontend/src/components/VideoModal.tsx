"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Icon } from "./Icons";
import type { Video } from "@/lib/types";

/** Figma: "Video Review — Modal phát video". The real player only loads here (lite embed), never on page load. */
export default function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const tiktok = video.platform === "tiktok";
  const src = video.embedId
    ? tiktok
      ? `https://www.tiktok.com/embed/v2/${video.embedId}`
      : `https://www.youtube-nocookie.com/embed/${video.embedId}?autoplay=1`
    : null;

  return (
    <div role="dialog" aria-modal="true" aria-label={video.title} className="fixed inset-0 z-[70] flex animate-fadeIn items-center justify-center bg-[#0f0d0a]/[.88] p-4" onClick={onClose}>
      <button ref={closeRef} onClick={onClose} aria-label="Đóng" className="absolute right-6 top-6 text-white hover:text-goldL">
        <Icon name="close" size={28} />
      </button>
      <div className="flex max-h-full flex-col items-center gap-8 md:flex-row" onClick={(e) => e.stopPropagation()}>
        <div className={`relative overflow-hidden rounded-lg bg-black ${tiktok ? "aspect-[9/16] h-[min(676px,70vh)]" : "aspect-video w-[min(900px,90vw)]"}`}>
          {src ? (
            <iframe src={src} title={video.title} className="size-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <>
              <Image src={video.thumbnail} alt="" fill sizes="400px" className="object-cover opacity-70" />
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                <span className="flex size-[72px] items-center justify-center rounded-full bg-white/90 text-esp">
                  <Icon name="play" size={28} />
                </span>
                <span className="text-[13px] font-semibold">Xem trên {tiktok ? "TikTok" : "YouTube"}</span>
              </a>
            </>
          )}
        </div>
        <div className="flex max-w-[420px] flex-col gap-4">
          <h3 className="text-[24px] font-bold leading-[1.35] text-white">{video.title}</h3>
          <p className="text-[13px] text-soft">
            {tiktok ? "TikTok" : "YouTube"} · {video.views} lượt xem
          </p>
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-goldL hover:underline">
            Xem trên {tiktok ? "TikTok" : "YouTube"} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
