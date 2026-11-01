import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { areaLabel, specLine } from "@/lib/format";

/** Figma: "Featured Property Card" (landscape 400×270, info box bottom-left, hover darkens). */
export default function FeaturedCard({ p }: { p: Property }) {
  return (
    <Link
      href={`/property/${p.code}`}
      className="group relative block h-[270px] w-[min(400px,82vw)] shrink-0 snap-start overflow-hidden bg-sand"
      aria-label={`${p.title} – ${p.priceLabel}`}
    >
      <Image src={p.images[0]} alt="" fill sizes="400px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      <span className="absolute inset-0 bg-[#1f1c19]/0 transition-colors duration-300 group-hover:bg-[#1f1c19]/60" />
      <span className="absolute bottom-0 left-0 flex w-[232px] flex-col gap-px bg-[#E6E3DF]/[.88] px-3.5 pb-3.5 pt-3">
        <span className="text-[17px] font-semibold text-ink">{p.priceLabel.replace(" triệu/tháng", " tr/tháng")}</span>
        <span className="text-[10px] leading-[1.4] text-[#3A3632]">{p.title}</span>
        <span className="text-[10px] leading-[1.4] text-[#3A3632]">Phân khu {p.district}</span>
        <span className="text-[10px] leading-[1.4] text-[#3A3632]">{specLine(p)}</span>
        <span className="text-[10px] uppercase leading-[1.4] text-[#3A3632]">{areaLabel(p)}</span>
      </span>
    </Link>
  );
}
