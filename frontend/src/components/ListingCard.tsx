import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icons";
import FavoriteButton from "./FavoriteButton";
import type { Property } from "@/lib/types";
import { areaLabel, pricePerM2, TYPE_LABEL } from "@/lib/format";

/** Grid card (listing, similar, project units, favorites). Same photo + bottom-gradient look as FeaturedCard. */
export default function ListingCard({ p }: { p: Property }) {
  // 0 bedrooms/bathrooms (shophouse, khối đế) carries no information, so hide it.
  const specs: [Parameters<typeof Icon>[0]["name"], string | null][] = [
    ["bed", p.bedrooms ? `${p.bedrooms} PN` : null],
    ["bath", p.bathrooms ? `${p.bathrooms} WC` : null],
    ["area", areaLabel(p)],
    ["layers", p.floorLabel],
    ["compass", p.direction ?? null],
  ];
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_22px_rgba(51,38,26,0.12)] transition-shadow hover:shadow-[0_14px_32px_rgba(51,38,26,0.2)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand sm:aspect-[5/4]">
        <Image src={p.images[0]} alt="" fill sizes="(min-width:1280px) 384px, (min-width:640px) 50vw, 100vw" className={`object-cover transition-transform duration-500 group-hover:scale-105 ${p.status === "sold" ? "grayscale" : ""}`} loading="lazy" />
        {/* whole card clickable; overlays below are pointer-events-none except favorite */}
        <Link href={`/property/${p.code}`} aria-label={`${p.title} – ${p.priceLabel}`} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-white">{TYPE_LABEL[p.type]}</span>
            {p.status === "deposit" && <span className="rounded-full bg-[#C98A1B] px-2.5 py-1 text-[11px] font-bold text-white">Đã cọc</span>}
            {p.status === "sold" && <span className="rounded-full bg-esp px-2.5 py-1 text-[11px] font-bold text-white">Đã giao dịch</span>}
            {p.verifiedAt && p.status !== "sold" && (
              <span title="Anh Tuấn đã trực tiếp kiểm tra căn này" className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-verified">
                <Icon name="check" size={12} /> Đã xem thực tế
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {p.videoUrl && (
              <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
                <Icon name="play" size={11} /> Video
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
              <Icon name="cam" size={12} /> {p.images.length}
            </span>
            <FavoriteButton code={p.code} className="pointer-events-auto relative z-10 flex size-[28px] items-center justify-center rounded-full bg-white/95 text-esp hover:text-price" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-t from-espDeep via-espDeep/85 to-transparent px-4 pb-4 pt-24 text-white">
          <h3 className="line-clamp-2 text-[19px] font-bold leading-snug">{p.title}</h3>
          <p className="mt-0.5 text-[12px] text-white/75">
            Phân khu {p.district}
            {p.building ? ` · Tòa ${p.building.name}` : ""} · Ecopark
          </p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="text-[22px] font-bold leading-tight text-goldL">{p.priceLabel}</span>
            <span className="text-[12px] text-white/70">· {pricePerM2(p)}</span>
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 border-t border-white/20 pt-2.5 text-[12.5px]">
            {specs
              .filter(([, v]) => v)
              .map(([icon, v]) => (
                <li key={icon} className="flex items-center gap-1">
                  <Icon name={icon} size={14} className="text-goldL" /> {v}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
