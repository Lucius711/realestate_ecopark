"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../Icons";

// Master-plan image supplied by the site owner, shown unaltered with its source (GLAND) credited.
// Hotspots are traced over that 1600×900 image; district names match the listings' "district" field.
const IMG = { src: "/images/ecopark-tong-the.webp", w: 1600, h: 900, credit: "GLAND" };

// Points follow each district's coloured outline on the picture; items are the places labelled inside it.
const ZONES: { name: string; en: string; points: string; items: string[] }[] = [
  { name: "Rừng Cọ", en: "Palm Springs", points: "10,200 100,148 200,100 640,80 660,95 650,128 745,103 805,135 740,155 655,188 605,215 525,255 370,290 270,362 95,290 15,235", items: ["Trường liên cấp Đoàn Thị Điểm", "Công viên Mùa Xuân · Công viên Mùa Hạ", "Vườn Tùng · Vườn Mai", "Làng Hà Lan", "S-Premium (Sky Oasis) · Park River", "Spring Valley"] },
  { name: "Quận Đảo", en: "The Island", points: "105,312 270,370 355,315 365,323 425,325 595,465 555,570 560,650 578,710 420,740 245,745 115,778 95,768 118,700 100,615 58,612 55,600 75,575 68,420 20,408 22,368 62,365", items: ["Ecopark Grand – The Island", "Sky Oasis S1 · S2 · S3", "SolForest", "Haven Park", "Sky Forest", "Trường PTLC Việt – Nhật"] },
  { name: "Giáo dục", en: "Education", points: "525,258 655,188 760,157 795,168 780,195 745,245 715,305 690,333 650,322 590,300", items: ["Đại học Anh Quốc Việt Nam (BUV)", "Đại học Y khoa Tokyo Việt Nam"] },
  { name: "Sân Golf", en: "Golf", points: "720,312 780,230 801,190 850,128 1080,30 1260,112 1215,392 1180,408 820,330", items: ["Sân golf Ecopark", "Khu căn hộ ven sân golf", "Hồ cảnh quan"] },
  { name: "Sáng tạo", en: "Innovation", points: "585,562 650,395 710,322 1065,395 1118,410 1165,418 1185,445 1180,540 1160,580 1110,630 1050,682 960,627 900,607 820,603 705,612 670,562", items: ["Công viên Hồ Thiên Nga", "Landmark", "The Onsen", "Học viện Golf EPGA", "Trường Quốc tế Chadwick"] },
  { name: "Aquabay", en: "Aqua Bay", points: "1238,262 1400,293 1435,335 1428,370 1520,382 1515,420 1448,432 1538,522 1545,670 1520,740 1450,770 1448,800 1380,860 1355,848 1278,872 1070,690 1130,632 1170,598 1188,520 1192,445 1203,408 1222,393", items: ["Aqua Bay Residences · Mimosa", "Rạp phim CGV · Trung tâm thương mại", "Trường Edison", "Marina Arc", "WestBay", "Thảo Nguyên · Thủy Nguyên · Thủy Trúc"] },
];

/** "Phân khu theo bản đồ": the master-plan picture with 6 clickable districts; hover/tap swaps the amenities list. */
export default function DistrictMap() {
  const [i, setI] = useState(ZONES.findIndex((z) => z.name === "Sáng tạo"));
  const [zoom, setZoom] = useState(false);
  const d = ZONES[i];

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-4 text-white" aria-live="polite">
        <p className="text-[12px] font-bold tracking-[0.1em] text-goldL">
          PHÂN KHU {d.name.toUpperCase()} · {d.en.toUpperCase()}
        </p>
        <h3 className="text-[34px] font-bold leading-tight">TIỆN ÍCH LÂN CẬN</h3>
        <ul className="flex flex-col gap-3">
          {d.items.map((a) => (
            <li key={a} className="flex items-center gap-2.5 text-[14px]">
              <Icon name="pin" size={15} className="shrink-0 text-[#E2A07F]" /> {a}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-white/60">Di chuột hoặc bấm vào từng phân khu trên bản đồ</p>
        <Link href={`/properties/for-rent?district=${encodeURIComponent(d.name)}`} className="btn-gold self-start">
          XEM CĂN TẠI {d.name.toUpperCase()}
        </Link>
      </div>

      <figure className="flex flex-col gap-2">
        <div className="relative overflow-hidden rounded-md shadow-[0_14px_30px_rgba(0,0,0,0.3)]">
          <Image src={IMG.src} alt="Tổng thể khu đô thị Ecopark Hưng Yên với 6 phân khu" width={IMG.w} height={IMG.h} sizes="(min-width:1024px) 900px, 100vw" className="h-auto w-full" />
          {/* Clickable districts over the picture: invisible until hovered/selected. */}
          <svg viewBox={`0 0 ${IMG.w} ${IMG.h}`} className="absolute inset-0 size-full" role="group" aria-label="Chọn phân khu trên bản đồ">
            {ZONES.map((z, k) => (
              <polygon
                key={z.name}
                points={z.points}
                role="button"
                tabIndex={0}
                aria-pressed={k === i}
                aria-label={`Phân khu ${z.name} (${z.en})`}
                onMouseEnter={() => setI(k)}
                onFocus={() => setI(k)}
                onClick={() => setI(k)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setI(k)}
                fill="#B08A4F"
                fillOpacity={k === i ? 0.28 : 0}
                stroke="#FFFFFF"
                strokeOpacity={k === i ? 0.95 : 0}
                strokeWidth="5"
                strokeLinejoin="round"
                className="cursor-pointer outline-none transition-[fill-opacity,stroke-opacity] duration-200 hover:fill-opacity-15 focus-visible:[stroke-opacity:1]"
              />
            ))}
          </svg>
          <button onClick={() => setZoom(true)} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[12px] font-semibold text-esp shadow hover:bg-white">
            <Icon name="search" size={13} /> Phóng to
          </button>
        </div>
        <figcaption className="text-right text-[11px] text-white/60">Nguồn ảnh: {IMG.credit}</figcaption>
      </figure>

      {zoom && (
        <div role="dialog" aria-modal="true" aria-label="Bản đồ tổng thể Ecopark" className="fixed inset-0 z-[80] flex animate-fadeIn flex-col bg-black/90 p-3 md:p-6" onClick={() => setZoom(false)}>
          <div className="flex items-center justify-between pb-3 text-white">
            <p className="text-[13px]">Tổng thể khu đô thị Ecopark · Nguồn ảnh: {IMG.credit}</p>
            <button onClick={() => setZoom(false)} aria-label="Đóng" autoFocus className="rounded-full p-2 hover:bg-white/10">
              <Icon name="close" size={22} />
            </button>
          </div>
          {/* On phones the picture keeps its full width and scrolls sideways, so labels stay readable. */}
          <div className="flex-1 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <Image src={IMG.src} alt="Tổng thể khu đô thị Ecopark Hưng Yên với 6 phân khu" width={IMG.w} height={IMG.h} sizes="100vw" className="mx-auto h-auto w-[1600px] max-w-none md:w-full md:max-w-[1600px]" />
          </div>
        </div>
      )}
    </div>
  );
}
