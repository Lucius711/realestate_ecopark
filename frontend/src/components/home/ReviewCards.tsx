"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "../Icons";
import Empty from "../Empty";
import type { Testimonial } from "@/lib/types";

const PER_PAGE = 2;

/**
 * Figma "Testimonials" body: review cards (2 per page) + handover row on the left, portrait on the right,
 * and the centered ‹ XEM THÊM ĐÁNH GIÁ › bar under both — the arrows page the cards, so one component owns the layout.
 */
export default function ReviewCards({
  items,
  handover,
  portrait,
  moreLabel,
  moreHref,
  emptyLabel,
}: {
  items: Testimonial[];
  handover: React.ReactNode;
  portrait: React.ReactNode;
  moreLabel: string;
  moreHref: string;
  emptyLabel: string;
}) {
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const [page, setPage] = useState(0);
  const shown = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const go = (d: number) => setPage((p) => (p + d + pages) % pages);
  const arrow =
    "flex size-10 items-center justify-center text-white transition hover:text-gold disabled:cursor-default disabled:opacity-30 disabled:hover:text-white";

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="grid w-full gap-6 lg:grid-cols-[776px_1fr]">
        <div className="flex flex-col gap-6">
          {!items.length && <Empty dark>{emptyLabel}</Empty>}
          <div className="grid gap-6 md:grid-cols-2" aria-live="polite">
            {shown.map((it) => (
              <figure
                key={it.id}
                className="flex animate-fadeIn flex-col gap-5 bg-esp2 p-8"
              >
                <Icon name="quoteMark" size={28} className="text-gold" />
                <blockquote className="text-[13px] leading-[1.9] text-[#D8CDBE]">
                  {it.quote}
                </blockquote>
                <figcaption className="flex items-center gap-3.5">
                  <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#D9C7A3,#EADFC9)] text-[#8C6A35]">
                    {it.avatar ? (
                      <Image
                        src={it.avatar}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <Icon name="image" size={20} />
                    )}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[16px] font-medium text-white">
                      {it.name}
                    </span>
                    <span className="text-[12px] text-goldL">{it.deal}</span>
                  </span>
                </figcaption>
                <span
                  className="flex gap-[3px] text-gold"
                  aria-label={`${it.rating} sao`}
                >
                  {Array.from({ length: it.rating }, (_, k) => (
                    <Icon key={k} name="star" size={14} />
                  ))}
                </span>
              </figure>
            ))}
          </div>
          {handover}
        </div>
        {portrait}
      </div>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => go(-1)}
          disabled={pages < 2}
          aria-label="Đánh giá trước"
          className={arrow}
        >
          <Icon name="chevL" size={20} />
        </button>
        <a
          href={moreHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold"
        >
          {moreLabel}
        </a>
        <button
          onClick={() => go(1)}
          disabled={pages < 2}
          aria-label="Đánh giá sau"
          className={arrow}
        >
          <Icon name="chevR" size={20} />
        </button>
      </div>
    </div>
  );
}
