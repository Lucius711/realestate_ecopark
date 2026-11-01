"use client";

import Empty from "../Empty";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "../Icons";
import VideoModal from "../VideoModal";
import type { Video } from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";

/** Figma: "Video review (social feed)" – TikTok embed-style block (profile bar, 2×5 grid, follow button). */
export default function SocialFeed({
  videos,
  t,
}: {
  videos: Video[];
  t: Dict["feed"];
}) {
  const [active, setActive] = useState<Video | null>(null);
  // Both platforms: a YouTube video added in admin must show up too (the modal plays either).
  const tiktok = videos.slice(0, 10);
  if (!tiktok.length)
    return (
      <section className="gutter flex flex-col gap-5 bg-cream py-20">
        <p className="eyebrow">{t.eyebrow}</p>
        <Empty>{t.empty}</Empty>
      </section>
    );

  return (
    <section className="gutter bg-cream py-20">
      <div className="mx-auto flex max-w-site flex-col gap-[22px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted">
              {t.eyebrow}
            </p>
            <h2 className="text-[28px] font-extrabold text-esp md:text-[34px]">
              {t.title} <span className="text-gold">TikTok</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[26px] font-extrabold text-gold">
              {CONTACT.tiktokFollowers}
            </p>
            <p className="text-[10px] font-semibold tracking-[0.12em] text-muted">
              {t.followers}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 rounded-md border border-line bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="relative size-11 overflow-hidden rounded-full">
              <Image
                src="/images/aerial-park.webp"
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-bold text-esp">
                Nguyễn Tuấn Ecopark
              </span>
              <span className="text-[12px] text-muted">
                {CONTACT.tiktokHandle}
              </span>
            </div>
            <a
              href={CONTACT.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 rounded bg-[#FE2C55] px-3.5 py-[7px] text-[12px] font-bold text-white"
            >
              {t.follow}
            </a>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {tiktok.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => setActive(v)}
                  className="group relative block aspect-[227/300] w-full overflow-hidden rounded text-left"
                  aria-label={`Xem video: ${v.title}`}
                >
                  <Image
                    src={v.thumbnail}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 227px, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.35),transparent_35%,transparent_70%,rgba(0,0,0,.55))]" />
                  <span className="absolute left-3 right-3 top-2.5 text-[12px] font-extrabold leading-[1.25] text-white">
                    {v.title}
                  </span>
                  <span className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <span className="flex items-center gap-1 text-[11px] font-semibold">
                      <Icon name="play" size={12} /> {v.views}
                    </span>
                    <Icon name={v.platform} size={14} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center">
          <a
            href={CONTACT.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[2px] bg-esp px-[18px] py-[11px] text-[12px] font-bold tracking-[0.1em] text-white hover:bg-black"
          >
            <Icon name="tiktok" size={14} /> {t.followBtn}
          </a>
        </div>
      </div>
      {active && <VideoModal video={active} onClose={() => setActive(null)} />}
    </section>
  );
}
