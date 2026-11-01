"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "../Icons";

const ITEMS = [
  { img: "/images/evening-street.webp", title: "ĐIỂM ĐẾN NỔI BẬT", text: "Hồ Thiên Nga, công viên Mùa Xuân và phố đi bộ cuối tuần — nơi cư dân dạo bộ, đạp xe và tụ họp." },
  { img: "/images/flower-bridge.webp", title: "CẦU HOA", text: "Cây cầu phủ hoa giấy, góc check-in quen thuộc của cư dân và du khách." },
  { img: "/images/morning-jog.webp", title: "ĐƯỜNG CHẠY VEN HỒ", text: "Hàng chục km đường dạo dưới tán cây, sáng sớm luôn rộn ràng người chạy bộ." },
];

/** Figma 7:722 "About Ecopark" right column: photo + caption card + prev/next. */
export default function Highlights() {
  const [i, setI] = useState(0);
  const it = ITEMS[i];
  const go = (d: number) => setI((i + d + ITEMS.length) % ITEMS.length);
  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <div className="relative aspect-[720/560] overflow-hidden">
          <Image key={it.img} src={it.img} alt="" fill sizes="(min-width:1024px) 720px, 100vw" className="animate-fadeIn object-cover" />
        </div>
        <div className="relative -mt-16 ml-0 mr-10 flex max-w-[380px] flex-col gap-2 bg-white p-6 shadow-sm md:mr-0" aria-live="polite">
          <h3 className="text-[16px] font-bold text-esp">{it.title}</h3>
          <p className="text-[12px] leading-relaxed text-muted">{it.text}</p>
        </div>
      </div>
      <div className="flex">
        <button onClick={() => go(-1)} aria-label="Ảnh trước" className="flex size-11 items-center justify-center bg-esp text-white">
          <Icon name="chevL" size={18} />
        </button>
        <button onClick={() => go(1)} aria-label="Ảnh sau" className="flex size-11 items-center justify-center bg-gold text-white">
          <Icon name="chevR" size={18} />
        </button>
      </div>
    </div>
  );
}
