import type { Metadata } from "next";
import Shell from "@/components/Shell";
import MeetTuan from "@/components/home/MeetTuan";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Về tôi – Nguyễn Hồng Tuấn", description: "Chuyên viên bất động sản sống và làm việc tại Ecopark." };

// shortcut: stats + awards are the Figma sample values ("Thành tích mẫu") — replace with anh Tuấn's real ones before launch.
const STATS = [
  { value: "#1", label: "MÔI GIỚI ECOPARK\n2024" },
  { value: "#1", label: "KHU VỰC VĂN GIANG\n2023" },
  { value: "600+", label: "GIAO DỊCH\nTHÀNH CÔNG" },
  { value: "8", label: "NĂM KINH NGHIỆM\nTẠI ECOPARK" },
  { value: "4.9★", label: "ĐÁNH GIÁ\nKHÁCH HÀNG" },
];
const AWARDS = ["TOP SALE\nQUÝ 1", "TOP SALE\nQUÝ 2", "CHUYÊN GIA\nBIỆT THỰ", "DỊCH VỤ\nXUẤT SẮC", "KHÁCH HÀNG\nHÀI LÒNG", "TOP 10\nTOÀN SÀN", "GIẢI\nCỐNG HIẾN", "10 NĂM\nKINH NGHIỆM"];

/** Laurel wreath badge (Figma "Why work with me" awards row). */
function Laurel({ label }: { label: string }) {
  const leaves = Array.from({ length: 6 }, (_, i) => 130 + i * 24);
  return (
    <li className="relative flex size-[84px] items-center justify-center">
      <svg viewBox="0 0 84 84" className="absolute inset-0 text-white" aria-hidden>
        {[1, -1].map((side) =>
          leaves.map((deg) => {
            const ang = side === 1 ? deg : 540 - deg; // left arc, mirrored to the right
            const a = (ang * Math.PI) / 180;
            const x = 42 + 34 * Math.cos(a);
            const y = 42 - 34 * Math.sin(a);
            return <ellipse key={`${side}${deg}`} cx={x} cy={y} rx="2.6" ry="6.5" fill="currentColor" transform={`rotate(${-ang + side * 25} ${x} ${y})`} />;
          }),
        )}
        <text x="42" y="22" textAnchor="middle" fontSize="7" fill="currentColor">★</text>
      </svg>
      <span className="relative whitespace-pre-line text-center text-[8px] font-bold leading-tight text-white">{label}</span>
    </li>
  );
}

/** Figma 59:943 "V2 — Trang Về tôi": Meet Tuấn + "Tại sao chọn tôi". */
export default function AboutPage() {
  return (
    <Shell>
      <MeetTuan t={dict.vi.meet} aboutHref="#contact" heading={"GẶP GỠ\nTUẤN"} />
      <section className="gutter flex flex-col items-center gap-12 bg-[#4A3F33] py-20 text-white">
        <div className="text-center">
          <p className="text-[20px] font-bold tracking-[0.06em]">TẠI SAO</p>
          <h2 className="text-[44px] font-extrabold md:text-[64px]">CHỌN TÔI</h2>
        </div>
        <dl className="grid w-full grid-cols-2 gap-8 md:grid-cols-5">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2 text-center">
              <dd className="text-[40px] font-extrabold">{s.value}</dd>
              <dt className="whitespace-pre-line text-[10px] font-medium tracking-[0.04em] text-white/75">{s.label}</dt>
            </div>
          ))}
        </dl>
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-5">
          {AWARDS.map((a) => (
            <Laurel key={a} label={a} />
          ))}
        </ul>
      </section>
    </Shell>
  );
}
