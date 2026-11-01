import type { Metadata } from "next";
import Image from "next/image";
import Shell from "@/components/Shell";
import DistrictMap from "@/components/ecopark/DistrictMap";
import Highlights from "@/components/ecopark/Highlights";

export const metadata: Metadata = { title: "Về Ecopark – Thành phố xanh", description: "Giới thiệu khu đô thị Ecopark, bản đồ phân khu và trải nghiệm sống." };

// Figma 8:743 mosaic on a 12-column grid: 4·4·4 / 8(2 rows)·4·4 / 3·3·6, first cell is the title.
const TILES = [
  { img: "/images/morning-jog.webp", title: "ĐẠP XE QUANH HỒ", span: "md:col-span-4" },
  { img: "/images/forest-rays.webp", title: "CÔNG VIÊN MÙA XUÂN", span: "md:col-span-4" },
  { img: "/images/aerial-park.webp", title: "BỂ BƠI & SPA ONSEN", span: "md:col-span-8 md:row-span-2" },
  { img: "/images/towers-bougainvillea.webp", title: "TRƯỜNG HỌC LIÊN CẤP", span: "md:col-span-4" },
  { img: "/images/evening-street.webp", title: "PHỐ ĐI BỘ CUỐI TUẦN", span: "md:col-span-4" },
  { img: "/images/flower-bridge.webp", title: "SÂN THỂ THAO", span: "md:col-span-3" },
  { img: "/images/evening-street.webp", title: "CHỢ & SIÊU THỊ", span: "md:col-span-3" },
  { img: "/images/sunset-road.webp", title: "HỒ THIÊN NGA LÚC HOÀNG HÔN", span: "md:col-span-6" },
];

/** Figma 59:944 "V2 — Trang Về Ecopark". */
export default function EcoparkPage() {
  return (
    <Shell>
      <section className="grid items-center gap-10 bg-cream py-16 pl-4 pr-4 md:pl-10 lg:grid-cols-2 lg:gap-16 xl:grid-cols-[minmax(0,1fr)_720px] lg:pr-0 xl:pl-[120px]">
        <div className="flex max-w-[520px] flex-col gap-5">
          <p className="text-[18px] font-bold text-esp">GIỚI THIỆU</p>
          <h1 className="text-[56px] font-extrabold leading-none text-esp md:text-[80px]">ECOPARK</h1>
          <p className="text-[14px] leading-[1.9] text-muted">
            Chào mừng đến Ecopark — nơi hơn 500 ha cây xanh, hồ nước và những con đường rợp bóng cây chỉ cách trung tâm Hà Nội khoảng 30 phút. Ở đây, buổi sáng bắt đầu bằng tiếng chim, buổi chiều là những vòng xe đạp quanh hồ. Tôi sẽ đưa bạn đi khắp khu đô thị, gặp gỡ hàng xóm và tìm hiểu thị trường.
          </p>
          <p className="text-[14px] text-muted">Hẹn gặp bạn ở Ecopark…</p>
          <a href="#map" className="btn-gold self-start">
            ĐỌC THÊM
          </a>
        </div>
        <Highlights />
      </section>

      <section id="map" className="gutter relative flex flex-col items-center gap-12 overflow-hidden bg-[#7A6B5C] pb-20">
        <div className="bg-white px-10 py-5 text-center md:px-16">
          <p className="text-[12px] font-bold text-esp">TÌM KIẾM</p>
          <h2 className="text-[26px] font-extrabold text-esp md:text-[38px]">PHÂN KHU THEO BẢN ĐỒ</h2>
        </div>
        <div className="w-full">
          <DistrictMap />
        </div>
      </section>

      <section className="grid auto-rows-[240px] md:auto-rows-[220px] md:grid-cols-12">
        <div className="flex flex-col justify-center gap-2 bg-white px-8 md:col-span-4 md:pl-[120px]">
          <p className="text-[18px] font-bold text-esp">TRẢI NGHIỆM</p>
          <h2 className="text-[48px] font-extrabold leading-none text-esp">ECOPARK</h2>
        </div>
        {TILES.map((t) => (
          <figure key={t.title} className={`group relative overflow-hidden ${t.span}`}>
            <Image src={t.img} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent to-50%" />
            <figcaption className="absolute bottom-5 left-7 text-[14px] font-bold tracking-[0.08em] text-white">{t.title}</figcaption>
          </figure>
        ))}
      </section>
    </Shell>
  );
}
