"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type HeroSlide = { src: string; position?: string };

const INTERVAL = 6000; // ms each photo stays
const FADE = 1400; // ms of the cross-fade

/**
 * Hero photos in the style of apple.com: full-bleed, a slow cross-fade (no zoom: scaling a big photo makes it shimmer), and a small
 * pill-shaped progress indicator with a pause button (people must be able to stop moving content).
 */
export default function HeroSlides({ slides }: { slides: HeroSlide[] }) {
  const [i, go] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const auto = playing && !reduced && slides.length > 1;

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => go((i + 1) % slides.length), INTERVAL);
    return () => clearTimeout(t);
  }, [i, auto, slides.length]);

  return (
    <>
      {slides.map((s, n) => (
        <Image
          key={s.src}
          src={s.src}
          alt=""
          fill
          priority={n === 0}
          sizes="100vw"
          aria-hidden
          className="object-cover transition-opacity ease-in-out"
          style={{
            objectPosition: s.position,
            opacity: n === i ? 1 : 0,
            transitionDuration: `${FADE}ms`,
          }}
        />
      ))}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-7 z-10 flex items-center justify-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full bg-black/35 px-3.5 py-3">
            {slides.map((s, n) => (
              <button key={s.src} type="button" onClick={() => go(n)} aria-label={`Ảnh ${n + 1} / ${slides.length}`} aria-current={n === i} className={`relative h-1.5 overflow-hidden rounded-full bg-white/45 transition-[width] duration-500 ${n === i ? "w-10" : "w-1.5"}`}>
                {n === i && <span key={`${i}-${auto}`} className="absolute inset-0 origin-left bg-white" style={auto ? { animation: `heroFill ${INTERVAL}ms linear forwards` } : undefined} />}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Tạm dừng chuyển ảnh" : "Tiếp tục chuyển ảnh"} className="grid size-8 place-items-center rounded-full bg-black/35 text-white hover:bg-black/50">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              {playing ? <path d="M6 4h4v16H6zM14 4h4v16h-4z" /> : <path d="M7 4v16l13-8z" />}
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
