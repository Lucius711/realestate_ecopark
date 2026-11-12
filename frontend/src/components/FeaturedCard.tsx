import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icons";
import type { Property } from "@/lib/types";
import { areaLabel } from "@/lib/format";

/** Home carousel card: full-bleed photo, info on a bottom gradient (no box covering the photo). */
export default function FeaturedCard({ p }: { p: Property }) {
  // 0 bedrooms/bathrooms (shophouse, khối đế) carries no information, so hide it.
  const specs: [Parameters<typeof Icon>[0]["name"], string | null][] = [
    ["bed", p.bedrooms ? `${p.bedrooms} PN` : null],
    ["bath", p.bathrooms ? `${p.bathrooms} WC` : null],
    ["area", areaLabel(p)],
    ["layers", p.floorLabel],
  ];
  return (
    <Link
      href={`/property/${p.code}`}
      className="group relative block aspect-[4/5] w-[min(340px,82vw)] shrink-0 snap-start overflow-hidden rounded-xl bg-sand shadow-[0_8px_22px_rgba(51,38,26,0.14)] sm:aspect-[4/3] sm:w-[400px]"
      aria-label={`${p.title} – ${p.priceLabel}`}
    >
      <Image src={p.images[0]} alt="" fill sizes="(min-width:640px) 400px, 82vw" className={`object-cover transition-transform duration-500 group-hover:scale-105 ${p.status === "sold" ? "grayscale" : ""}`} />
      <span className="absolute inset-x-3 top-3 flex items-start justify-between">
        <span className="flex gap-1.5">
          {p.status === "deposit" && <span className="rounded-full bg-[#C98A1B] px-2.5 py-1 text-[11px] font-bold text-white">Đã cọc</span>}
          {p.status === "sold" && <span className="rounded-full bg-esp px-2.5 py-1 text-[11px] font-bold text-white">Đã giao dịch</span>}
          {p.verifiedAt && p.status !== "sold" && (
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-verified">
              <Icon name="check" size={12} /> Đã xem thực tế
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
          <Icon name="cam" size={12} /> {p.images.length}
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-t from-espDeep via-espDeep/85 to-transparent px-4 pb-4 pt-24 text-white">
        <span className="line-clamp-2 text-[19px] font-bold leading-snug">{p.title}</span>
        <span className="mt-0.5 text-[12px] text-white/75">Phân khu {p.district} · Ecopark</span>
        <span className="mt-1.5 text-[22px] font-bold leading-tight text-goldL">{p.priceLabel.replace(" triệu/tháng", " tr/tháng")}</span>
        <span className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 border-t border-white/20 pt-2.5 text-[12.5px]">
          {specs
            .filter(([, v]) => v)
            .map(([icon, v]) => (
              <span key={icon} className="flex items-center gap-1">
                <Icon name={icon} size={14} className="text-goldL" /> {v}
              </span>
            ))}
        </span>
      </span>
    </Link>
  );
}
