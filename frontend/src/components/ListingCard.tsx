import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icons";
import FavoriteButton from "./FavoriteButton";
import type { Property } from "@/lib/types";
import { areaLabel, pricePerM2, timeAgo, TYPE_LABEL } from "@/lib/format";
import { CONTACT } from "@/lib/contact";

/** Figma: component "V2 / Listing Card" (listing + similar sections). */
export default function ListingCard({ p }: { p: Property }) {
  const specs: [Parameters<typeof Icon>[0]["name"], string | null][] = [
    ["bed", p.bedrooms != null ? `${p.bedrooms} PN` : null],
    ["bath", p.bathrooms != null ? `${p.bathrooms} WC` : null],
    ["area", areaLabel(p)],
    ["floor", p.building ? `Tòa ${p.building.name}` : null],
    ["layers", p.floorLabel],
    ["compass", p.direction ?? null],
  ];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-lineL bg-white shadow-[0_6px_18px_rgba(51,38,26,0.06)] transition-shadow hover:shadow-[0_12px_28px_rgba(51,38,26,0.12)]">
      <div className="relative h-[250px] overflow-hidden">
        <Image src={p.images[0]} alt="" fill sizes="(min-width:1280px) 384px, (min-width:768px) 50vw, 100vw" className={`object-cover transition-transform duration-500 group-hover:scale-105 ${p.status === "sold" ? "grayscale" : ""}`} loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-60% to-black/45" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          <div className="flex gap-1.5">
            <span className="rounded-[3px] bg-gold px-2.5 py-[5px] text-[11px] font-bold tracking-[0.08em] text-white">{TYPE_LABEL[p.type]}</span>
            {p.status === "deposit" && <span className="rounded-[3px] bg-[#C98A1B] px-2 py-[5px] text-[11px] font-bold tracking-[0.08em] text-white">ĐÃ CỌC</span>}
            {p.status === "sold" && <span className="rounded-[3px] bg-esp px-2 py-[5px] text-[11px] font-bold tracking-[0.08em] text-white">ĐÃ GIAO DỊCH</span>}
            {p.verifiedAt && p.status !== "sold" && (
              <span title="Anh Tuấn đã trực tiếp kiểm tra căn này" className="flex items-center gap-1 rounded-[3px] bg-white px-2 py-[5px] text-[11px] font-semibold text-verified">
                <Icon name="check" size={12} /> Đã xem thực tế
              </span>
            )}
          </div>
          <FavoriteButton code={p.code} className="relative z-10 flex size-[30px] items-center justify-center rounded-full bg-white text-esp hover:text-price" />
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
          {p.videoUrl ? (
            <span className="flex items-center gap-1 rounded-[3px] bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
              <Icon name="play" size={11} /> Video
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 rounded-[3px] bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
            <Icon name="cam" size={12} /> {p.images.length}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-[18px] py-4">
        <p className="flex items-baseline gap-2">
          <span className="text-[20px] font-bold text-price">{p.priceLabel}</span>
          <span className="text-[12px] text-muted">· {pricePerM2(p)}</span>
        </p>
        <h3 className="text-[16px] font-semibold text-ink">
          {/* stretched link: whole card is clickable, Zalo button stays separately clickable */}
          <Link href={`/property/${p.code}`} className="after:absolute after:inset-0">
            {p.title}
          </Link>
        </h3>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {specs
            .filter(([, v]) => v)
            .map(([icon, v]) => (
              <li key={icon} className="flex items-center gap-[5px] text-[13px] text-ink">
                <Icon name={icon} size={15} className="text-gold" /> {v}
              </li>
            ))}
        </ul>
        <p className="flex items-center gap-[5px] text-[13px] text-muted">
          <Icon name="pin" size={14} /> Phân khu {p.district}, Ecopark
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-lineL pt-3">
          <span className="flex items-center gap-2 text-[12px] text-muted">
            <span className="relative size-7 overflow-hidden rounded-full">
              <Image src="/images/tuan-portrait.webp" alt="" fill sizes="28px" className="object-cover" />
            </span>
            Nguyễn Tuấn · {timeAgo(p.postedAt)}
          </span>
          <a href={CONTACT.zalo} target="_blank" rel="noopener noreferrer" className="relative z-10 flex items-center gap-1.5 rounded border border-zalo px-3 py-1.5 text-[12px] font-semibold text-zalo hover:bg-zalo hover:text-white">
            <Icon name="phone" size={13} /> Zalo
          </a>
        </div>
      </div>
    </article>
  );
}
