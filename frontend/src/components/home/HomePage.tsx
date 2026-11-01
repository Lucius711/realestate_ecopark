import Shell from "../Shell";
import Hero from "./Hero";
import MeetTuan from "./MeetTuan";
import ProjectSlider from "./ProjectSlider";
import SocialFeed from "./SocialFeed";
import QuickSearch from "./QuickSearch";
import Featured from "./Featured";
import Testimonials from "./Testimonials";
import {
  getProperties,
  getSlides,
  getTestimonials,
  getVideos,
} from "@/lib/api";
import { dict, type Lang } from "@/lib/i18n";
import type { Property, PropertyType } from "@/lib/types";

/** Homepage, section order as in Figma "V2 — Julie style" (and "Homepage EN"). */
export default async function HomePage({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const [props, slides, videos, testimonials] = await Promise.all([
    getProperties(),
    getSlides(),
    getVideos(),
    getTestimonials(),
  ]);
  // Pinned listings first ("Ghim lên trang chủ"); sort is stable, so the rest keep newest-first.
  const byType = [...props].sort((a, b) => Number(b.pinned) - Number(a.pinned)).reduce(
    (acc, p) => ((acc[p.type] ??= []).push(p), acc),
    {} as Record<PropertyType, Property[]>,
  );
  return (
    <Shell lang={lang}>
      <Hero t={t.hero} />
      <MeetTuan t={t.meet} />
      <ProjectSlider slides={slides} t={t.slider} />
      <SocialFeed videos={videos} t={t.feed} />
      <QuickSearch t={t.search} />
      <Featured t={t.featured} byType={byType} />
      <Testimonials items={testimonials} t={t.testi} />
    </Shell>
  );
}
