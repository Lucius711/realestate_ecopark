"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "../Icons";
import type { Dict } from "@/lib/i18n";

const SLUGS = ["for-rent", "resale", "projects"];

/** Figma: "Quick search strip" – 3 tabs + keyword/price/bed/bath fields; submits to the listing page with query params. */
export default function QuickSearch({ t }: { t: Dict["search"] }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const q = new URLSearchParams();
    for (const k of ["q", "min", "max", "beds", "baths"]) {
      const v = String(f.get(k) ?? "").trim();
      if (v) q.set(k, v);
    }
    router.push(`/properties/${SLUGS[tab]}${q.size ? `?${q}` : ""}`);
  }

  const box = "h-7 border border-white bg-transparent px-2 text-[10px] font-medium italic text-white placeholder:text-white focus:outline-none focus:ring-1 focus:ring-goldL";
  return (
    <section className="relative flex flex-col items-center bg-[linear-gradient(135deg,#8D7B62,#B9A47F)] px-4 pb-6 pt-[26px]">
      <div className="absolute inset-0 bg-[#1f1a14]/45" aria-hidden />
      <div className="relative flex gap-0.5" role="tablist">
        {t.tabs.map((label, i) => (
          <button key={label} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`px-[18px] py-[9px] text-[11px] font-bold tracking-[0.1em] text-white ${tab === i ? "bg-gold" : "bg-[#14120f]/30 hover:bg-[#14120f]/50"}`}>
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="relative flex w-full max-w-[748px] flex-wrap items-center gap-0.5 bg-[#14120f]/45 p-4">
        <label className="flex h-7 min-w-[200px] flex-1 items-center gap-2 border border-white px-1.5 text-white sm:basis-[262px] sm:flex-none">
          <Icon name="search" size={18} strokeWidth={2} />
          <input name="q" aria-label={t.keyword} placeholder={t.keyword} className="w-full bg-transparent text-[10px] font-medium italic placeholder:text-white focus:outline-none" />
        </label>
        <input name="min" inputMode="numeric" aria-label={t.min} placeholder={t.min} className={`${box} w-[90px]`} />
        <input name="max" inputMode="numeric" aria-label={t.max} placeholder={t.max} className={`${box} w-[90px]`} />
        {(["beds", "baths"] as const).map((k) => (
          <select key={k} name={k} aria-label={k === "beds" ? t.beds : t.baths} className={`${box} w-[90px] not-italic [&>option]:text-ink`} defaultValue="">
            <option value="">{k === "beds" ? t.beds : t.baths}</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        ))}
        <button className="ml-0.5 flex h-7 w-20 items-center justify-center bg-[#1f1c19]/85 text-white hover:bg-black" aria-label="Tìm kiếm">
          <Icon name="search" size={22} strokeWidth={2.2} />
        </button>
      </form>
    </section>
  );
}
