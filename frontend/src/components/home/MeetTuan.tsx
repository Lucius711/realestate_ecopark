import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "../Icons";
import type { Dict } from "@/lib/i18n";

const ICONS: IconName[] = ["user", "bulb", "chart", "heart"];

/** Figma: "Meet Tuan" – intro copy + 4 commitments + CTA, photo of Tuấn at Ecopark on the right. */
/** `heading` = the big "GẶP GỠ TUẤN" title used on /about (Figma 59:969); the homepage omits it. */
export default function MeetTuan({ t, aboutHref = "/about", heading }: { t: Dict["meet"]; aboutHref?: string; heading?: string }) {
  return (
    <section className="gutter grid items-center gap-12 bg-white py-16 lg:grid-cols-[minmax(0,700px)_1fr] lg:gap-10 lg:pr-20 lg:pt-[90px]">
      <div className="flex flex-col gap-6">
        {heading && <h1 className="whitespace-pre-line text-[52px] font-extrabold leading-[1.1] text-esp md:text-[80px]">{heading}</h1>}
        <h2 className={heading ? "text-[20px] font-medium text-esp" : "text-[32px] font-medium leading-tight text-esp md:text-[45px]"}>{t.title}</h2>
        <p className="max-w-[598px] text-[16px] leading-[1.9] text-muted md:text-[18px]">{t.body}</p>
        <ul className="flex flex-wrap gap-9 pt-1">
          {t.values.map((v, i) => (
            <li key={v} className="flex flex-col gap-2">
              <Icon name={ICONS[i]} size={28} strokeWidth={1.5} className="text-gold" />
              <span className="whitespace-pre-line text-[13px] font-medium leading-[1.4] text-esp">{v}</span>
            </li>
          ))}
        </ul>
        <div className="pt-4">
          <Link href={aboutHref} className="btn-gold">
            {t.cta} <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
      <div className="relative aspect-[664/760] w-full max-w-[664px] overflow-hidden rounded lg:-my-[54px] lg:-ml-[109px]">
        <Image src="/images/tuan-ecopark.webp" alt="Anh Nguyễn Hồng Tuấn tại sảnh Ecopark" fill sizes="(min-width:1024px) 664px, 100vw" className="object-cover object-top" priority={false} />
      </div>
    </section>
  );
}
