import Image from "next/image";
import ReviewCards from "./ReviewCards";
import { CONTACT } from "@/lib/contact";
import type { Testimonial } from "@/lib/types";
import type { Dict } from "@/lib/i18n";

// Handover photos live in public/images/clients/ (client-1..4.webp).
// Where "XEM THÊM ĐÁNH GIÁ" goes: the page holding anh Tuấn's real reviews (Facebook / Google Maps).
const REVIEWS_URL = process.env.NEXT_PUBLIC_REVIEWS_URL ?? CONTACT.facebook;
const HANDOVER = [1, 2, 3, 4].map((n) => `/images/clients/client-${n}.webp`);

/** Figma: "Testimonials" – dark band, 2 review cards, handover photo row, portrait of Tuấn. */
export default function Testimonials({
  items,
  t,
}: {
  items: Testimonial[];
  t: Dict["testi"];
}) {
  return (
    <section className="gutter relative bg-[linear-gradient(135deg,#5E5040,#8E7B60)] py-[100px]">
      <div className="absolute inset-0 bg-esp/80" aria-hidden />
      <div className="relative mx-auto flex max-w-site flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-3.5 text-center text-white">
          <p className="text-[18px] font-bold tracking-[0.12em] md:text-[22px]">
            {t.eyebrow}
          </p>
          <h2 className="text-[44px] font-extrabold leading-[1.25] md:text-[68px]">
            {t.title}
          </h2>
        </div>
        <ReviewCards
          items={items}
          moreLabel={t.more}
          moreHref={REVIEWS_URL}
          emptyLabel={t.empty}
          handover={
            <div className="flex flex-col gap-3.5">
              <p className="text-[13px] font-bold tracking-[0.14em] text-white">
                {t.handover}
              </p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {HANDOVER.map((src, k) => (
                  <li
                    key={src}
                    className="relative aspect-[185/150] overflow-hidden bg-[linear-gradient(135deg,#D9C7A3,#EADFC9)]"
                  >
                    <Image
                      src={src}
                      alt={`Khách hàng nhận bàn giao nhà #${k + 1}`}
                      fill
                      sizes="185px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </li>
                ))}
              </ul>
            </div>
          }
          portrait={
            <div className="relative hidden min-h-[560px] overflow-hidden lg:block">
              <Image
                src="/images/tuan-portrait.webp"
                alt="Chân dung anh Nguyễn Hồng Tuấn"
                fill
                sizes="400px"
                className="object-cover"
                loading="lazy"
              />
            </div>
          }
        />
      </div>
    </section>
  );
}
