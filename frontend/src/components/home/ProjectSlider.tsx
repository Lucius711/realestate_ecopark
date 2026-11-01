"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../Icons";
import Empty from "../Empty";
import type { Slide } from "@/lib/types";
import type { Dict } from "@/lib/i18n";

/** Figma: "Dự án đang mở bán" + component "Slider / Dự án đang mở bán" (auto 5s, arrows, dots). Slides come from the admin API. */
export default function ProjectSlider({
  slides,
  t,
}: {
  slides: Slide[];
  t: Dict["slider"];
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (paused || n < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(id);
  }, [paused, n]);

  const heading = (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div className="flex flex-col gap-1">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 className="display">{t.title}</h2>
      </div>
      <p className="text-[14px] text-muted">{t.note}</p>
    </div>
  );
  if (!n)
    return (
      <section className="gutter flex flex-col gap-7 bg-white pb-10 pt-20">
        {heading}
        <Empty>{t.empty}</Empty>
      </section>
    );
  const s = slides[i];

  return (
    <section className="gutter flex flex-col gap-7 bg-white pb-10 pt-20">
      {heading}

      <div
        className="relative h-[440px] w-full overflow-hidden rounded-md"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label={t.title}
      >
        {slides.map((sl, k) => (
          <div
            key={sl.id}
            className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
            aria-hidden={k !== i}
          >
            <Image
              src={sl.image}
              alt=""
              fill
              sizes="(min-width:1280px) 1200px, 100vw"
              className="object-cover"
              priority={k === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(26,20,15,0.85)] via-[rgba(26,20,15,0.34)] via-60% to-transparent" />
          </div>
        ))}

        <div
          key={s.id}
          className="absolute left-6 top-[70px] flex max-w-[480px] animate-fadeIn flex-col items-start gap-3.5 md:left-14"
        >
          <span className="rounded-[2px] bg-gold px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white">
            {t.badge}
          </span>
          <h3 className="text-[36px] font-extrabold leading-[1.1] text-white md:text-[52px]">
            {s.title}
          </h3>
          <p className="text-[15px] font-semibold text-goldL">{s.location}</p>
          <p className="text-[16px] leading-[1.6] text-creamT">
            {s.description}
          </p>
          <Link href={s.link} className="btn-gold px-6 py-[13px]">
            {t.cta} <Icon name="arrow" size={16} />
          </Link>
        </div>

        <div className="absolute bottom-8 left-6 flex gap-2 md:left-14">
          {slides.map((sl, k) => (
            <button
              key={sl.id}
              onClick={() => setI(k)}
              aria-label={`Slide ${k + 1}`}
              aria-current={k === i}
              className={`h-1 rounded-sm transition-all ${k === i ? "w-7 bg-white" : "w-2 bg-white/45"}`}
            />
          ))}
        </div>
        <div className="absolute bottom-5 right-6 flex gap-2 md:right-10">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              onClick={() => setI((x) => (x + d + n) % n)}
              aria-label={d < 0 ? "Slide trước" : "Slide tiếp"}
              className="flex size-11 items-center justify-center rounded-full border border-white/60 text-white hover:bg-white/15"
            >
              <Icon name={d < 0 ? "chevL" : "chevR"} size={18} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
