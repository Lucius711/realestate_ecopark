"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "../Icons";

// shortcut: shapes are a hand-simplified trace of the Figma "Search areas by map" (15:1131), not the official master plan.
const DISTRICTS = [
  { name: "Rừng Cọ", label: [95, 52], path: "M4 30 L165 22 L162 58 L128 64 L98 76 L58 70 L4 98 Z", items: ["Công viên Mùa Xuân", "Phố đi bộ Rừng Cọ", "Trường Đoàn Thị Điểm", "Biệt thự, liền kề"] },
  { name: "Giáo dục", label: [190, 58], path: "M170 22 L230 18 L230 72 L172 80 L168 60 Z", items: ["Đại học Anh Quốc (BUV)", "Trường liên cấp Edison", "Thư viện cộng đồng", "Sân thể thao"] },
  { name: "Quận Đảo", label: [82, 158], path: "M4 104 L60 76 L98 82 L130 70 L162 86 L162 205 L140 258 L6 252 Z", items: ["Hồ Thiên Nga", "Bến du thuyền", "Biệt thự đảo", "Câu lạc bộ cư dân"] },
  { name: "Sân Golf", label: [300, 46], path: "M236 8 L380 2 L382 72 L236 78 Z", items: ["Sân golf Ecopark", "Biệt thự view golf", "Clubhouse", "Đường chạy bộ"] },
  { name: "Sáng tạo", label: [262, 122], path: "M170 88 L378 76 L346 202 L172 196 Z", items: ["Công viên hồ Thiên Nga", "Swanlake Onsen", "Tòa Landmark", "Khu CBD thông minh"] },
  { name: "Aquabay", label: [416, 168], path: "M388 76 L422 86 L496 190 L482 252 L356 250 L352 205 Z", items: ["Biển hồ nước mặn", "Trung tâm thương mại", "Bể bơi bốn mùa", "Căn hộ Aquabay"] },
];

/** Figma 15:1131 "Search areas by map": hover/tap a district to swap the nearby-amenities list. */
export default function DistrictMap() {
  const [i, setI] = useState(4);
  const d = DISTRICTS[i];
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-4 text-white" aria-live="polite">
        <p className="text-[12px] font-bold tracking-[0.1em] text-goldL">PHÂN KHU {d.name.toUpperCase()}</p>
        <h3 className="text-[34px] font-bold leading-tight">TIỆN ÍCH LÂN CẬN</h3>
        <ul className="flex flex-col gap-3">
          {d.items.map((a) => (
            <li key={a} className="flex items-center gap-2.5 text-[14px]">
              <Icon name="pin" size={15} className="text-[#E2A07F]" /> {a}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-white/60">Di chuột hoặc bấm vào từng phân khu trên bản đồ</p>
        <Link href={`/properties/for-rent?district=${encodeURIComponent(d.name)}`} className="btn-gold self-start">
          XEM CĂN TẠI {d.name.toUpperCase()}
        </Link>
      </div>
      <svg viewBox="0 0 500 262" className="w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]" role="group" aria-label="Bản đồ phân khu Ecopark">
        {DISTRICTS.map((x, k) => (
          <g
            key={x.name}
            role="button"
            tabIndex={0}
            aria-pressed={k === i}
            aria-label={`Phân khu ${x.name}`}
            onMouseEnter={() => setI(k)}
            onFocus={() => setI(k)}
            onClick={() => setI(k)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setI(k)}
            className="cursor-pointer outline-none"
          >
            <path d={x.path} fill={k === i ? "#EDE8E1" : "#1E1A17"} stroke="#6B5E50" strokeWidth="1.5" strokeLinejoin="round" className="transition-colors duration-200 hover:fill-[#3A302A]" style={k === i ? { fill: "#EDE8E1" } : undefined} />
            <text x={x.label[0]} y={x.label[1]} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={k === i ? "#2B2420" : "#FFFFFF"} className="pointer-events-none select-none">
              {x.name.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
