import Link from "next/link";
import { Icon } from "../Icons";
import type { Dict } from "@/lib/i18n";

/** Figma: "Hero" – background intro video (muted loop), centered headline + one CTA. */
export default function Hero({ t }: { t: Dict["hero"] }) {
  return (
    <section className="relative flex h-[560px] items-center justify-center overflow-hidden md:h-[760px]">
      {/* preload="metadata" + poster keeps the first paint light; on phones the poster shows until the video can play */}
      <video
        className="absolute inset-0 size-full object-cover"
        src="/video/hero-ecopark.mp4"
        poster="/images/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,15,10,0.25)] via-[rgba(20,15,10,0.2)] to-[rgba(20,15,10,0.75)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(26,20,15,0.55),rgba(26,20,15,0))]" />
      <div className="relative mt-16 flex max-w-[698px] flex-col items-center gap-5 px-4 text-center md:mt-[140px]">
        <h1 className="bg-gradient-to-r from-[#E3C994] to-gold bg-clip-text text-[34px] font-extrabold leading-[1.22] text-transparent [text-wrap:balance] md:text-[58px]">{t.title}</h1>
        <p className="max-w-[620px] text-[16px] leading-[1.6] text-creamT md:text-[18px]">{t.sub}</p>
        <div className="pt-2">
          <Link href="#properties" className="btn-gold">
            {t.cta} <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
