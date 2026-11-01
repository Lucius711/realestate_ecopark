import Link from "next/link";
import Carousel from "../Carousel";
import FeaturedCard from "../FeaturedCard";
import { Icon } from "../Icons";
import Empty from "../Empty";
import type { Property, PropertyType } from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import { TYPE_SLUG } from "@/lib/api";

/** Figma: "Featured properties" – Eco Retreat banner + 3 carousels (rent / resale / project). */
export default function Featured({
  t,
  byType,
}: {
  t: Dict["featured"];
  byType: Record<PropertyType, Property[]>;
}) {
  return (
    <section
      id="properties"
      className="scroll-mt-24 bg-white pb-[90px] pt-[72px]"
    >
      <div className="flex flex-col items-center gap-1.5">
        <p className="eyebrow">{t.eyebrow}</p>
        <h2 className="display">{t.title}</h2>
      </div>

      <div className="gutter pb-2 pt-14">
        <Link
          href="/projects/eco-retreat"
          className="group flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-md bg-[linear-gradient(90deg,rgba(26,20,15,.9),rgba(26,20,15,.36)_60%,transparent),url(/images/aerial-park.webp)] bg-cover bg-center px-6 py-9 md:px-10"
        >
          <span className="flex flex-col gap-2">
            <span className="self-start rounded-[2px] bg-gold px-2.5 py-[5px] text-[11px] font-bold tracking-[0.14em] text-white">
              {t.eco.badge}
            </span>
            <span className="text-[24px] font-extrabold text-white md:text-[32px]">
              {t.eco.title}
            </span>
            <span className="text-[15px] text-creamT">{t.eco.sub}</span>
          </span>
          <span className="btn-gold">
            {t.eco.cta} <Icon name="arrow" size={16} />
          </span>
        </Link>
      </div>

      {t.cats.map((c) => {
        const items = byType[c.type as PropertyType] ?? [];
        return (
          <div key={c.type}>
            <div className="gutter flex items-end justify-between gap-4 pb-[18px] pt-9">
              <div className="flex flex-col gap-1">
                <h3 className="text-[22px] font-extrabold text-esp md:text-[26px]">
                  {c.title}
                </h3>
                <p className="text-[12px] text-muted">{c.sub}</p>
              </div>
              <Link
                href={`/properties/${TYPE_SLUG[c.type as PropertyType]}`}
                className="flex shrink-0 items-center gap-2 text-[12px] font-bold tracking-[0.12em] text-gold hover:text-esp"
              >
                {t.seeAll} <Icon name="arrow" size={16} />
              </Link>
            </div>
            {items.length ? (
              <Carousel label={c.title}>
                {items.map((p) => (
                  <FeaturedCard key={p.code} p={p} />
                ))}
              </Carousel>
            ) : (
              <div className="gutter">
                <Empty>{t.empty}</Empty>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
