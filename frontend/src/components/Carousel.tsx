"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icons";

/**
 * Figma: "Carousel / …" – horizontal row with square arrow buttons on the edges and page bars below.
 * Uses native scroll-snap so touch swipe works; arrows scroll one "page" (visible width).
 */
export default function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setPages(Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05)));
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={ref} onScroll={measure} className="no-scrollbar gutter flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto md:scroll-px-10 xl:scroll-px-[120px]">
        {Children.map(children, (c) => c)}
      </div>
      <button onClick={() => go(-1)} aria-label="Trước" className="absolute left-2 top-[115px] hidden size-10 items-center justify-center bg-[#3A3532] text-white hover:bg-black md:flex xl:left-[100px]">
        <Icon name="chevL" size={20} strokeWidth={1.4} />
      </button>
      <button onClick={() => go(1)} aria-label="Tiếp" className="absolute right-2 top-[115px] hidden size-10 items-center justify-center bg-[#5E4D3D] text-white hover:bg-black md:flex xl:right-[100px]">
        <Icon name="chevR" size={20} strokeWidth={1.4} />
      </button>
      <div className="mt-[18px] flex justify-center gap-2" aria-hidden>
        {Array.from({ length: pages }, (_, i) => (
          <span key={i} className={`h-1 rounded-sm transition-all ${i === page ? "w-6 bg-gold" : "w-2 bg-[#D9CCB8]"}`} />
        ))}
      </div>
    </div>
  );
}
