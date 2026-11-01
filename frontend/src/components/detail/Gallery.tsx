"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "../Icons";

/** Figma 157:3708 "Gallery": large photo + 2×2 grid; last tile dims with "Xem tất cả N ảnh", big photo carries "Xem video review". */
export default function Gallery({ images, title, hasVideo, videoHref }: { images: string[]; title: string; hasVideo: boolean; videoHref?: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => ((i ?? 0) + 1) % images.length);
      if (e.key === "ArrowLeft") setOpen((i) => ((i ?? 0) - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  const tiles = images.slice(0, 5);
  return (
    <>
      <div className="grid h-[300px] gap-2 md:h-[452px] md:grid-cols-[3fr_1fr_1fr] md:grid-rows-2">
        {tiles.map((src, i) => {
          const last = i === tiles.length - 1 && i > 0;
          return (
            <div key={src + i} className={`relative overflow-hidden rounded ${i === 0 ? "md:row-span-2" : "hidden md:block"}`}>
              <button onClick={() => setOpen(i)} className="group absolute inset-0" aria-label={last ? `Xem tất cả ${images.length} ảnh` : `Xem ảnh ${i + 1}`}>
                <Image src={src} alt={i === 0 ? title : ""} fill sizes={i === 0 ? "(min-width:768px) 760px, 100vw" : "250px"} priority={i === 0} className="object-cover transition-transform duration-500 group-hover:scale-105" />
                {last && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 text-[13px] font-medium text-white">
                    <Icon name="cam" size={20} /> Xem tất cả {images.length} ảnh
                  </span>
                )}
              </button>
              {i === 0 && (
                <div className="pointer-events-none absolute bottom-4 left-4 flex gap-2 [&>*]:pointer-events-auto">
                  {hasVideo && videoHref && (
                    <a href={videoHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-esp shadow">
                      <Icon name="play" size={10} /> Xem video review
                    </a>
                  )}
                  <button onClick={() => setOpen(0)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-esp shadow md:hidden">
                    <Icon name="cam" size={14} /> {images.length} ảnh
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label="Thư viện ảnh" className="fixed inset-0 z-[70] flex animate-fadeIn items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={images[open]} alt={`${title} – ảnh ${open + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <button onClick={() => setOpen(null)} aria-label="Đóng" className="absolute right-5 top-5 text-white">
            <Icon name="close" size={28} />
          </button>
          {(["chevL", "chevR"] as const).map((n, k) => (
            <button
              key={n}
              aria-label={k ? "Ảnh sau" : "Ảnh trước"}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((i) => ((i ?? 0) + (k ? 1 : -1) + images.length) % images.length);
              }}
              className={`absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 ${k ? "right-5" : "left-5"}`}
            >
              <Icon name={n} size={22} />
            </button>
          ))}
          <p className="absolute bottom-5 text-[13px] text-white/80">
            {open + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
