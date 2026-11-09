import Link from "next/link";
import { Icon } from "../Icons";
import HeroSlides, { type HeroSlide } from "./HeroSlides";
import type { Dict } from "@/lib/i18n";

// Photos already in /public/images; `position` keeps the subject in frame on the wide, short hero crop.
const SLIDES: HeroSlide[] = [
  { src: "/images/aerial-park.webp", position: "50% 40%" },
  { src: "/images/sunset-road.webp", position: "50% 62%" },
  { src: "/images/towers-bougainvillea.webp", position: "50% 42%" },
  { src: "/images/flower-bridge.webp", position: "50% 28%" },
];

/** Figma: "Hero" – full-bleed photo slideshow (Apple style), centered headline + one CTA. */
export default function Hero({ t }: { t: Dict["hero"] }) {
  return (
    <section className="relative flex h-[560px] items-center justify-center overflow-hidden md:h-[760px]">
      <HeroSlides slides={SLIDES} />
      {/* one overlay, not two: fewer layers over the photos */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(26,20,15,0.55),rgba(26,20,15,0)),linear-gradient(to_bottom,rgba(20,15,10,0.25),rgba(20,15,10,0.2),rgba(20,15,10,0.75))]" />
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
