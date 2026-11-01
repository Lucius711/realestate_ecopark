"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import ListingCard from "../ListingCard";
import AlertButton from "./AlertButton";
import { Icon } from "../Icons";
import type { Property } from "@/lib/types";

const DISTRICTS = [
  "Rừng Cọ",
  "Quận Đảo",
  "Giáo dục",
  "Sân Golf",
  "Sáng tạo",
  "Aquabay",
];
const SORTS = {
  new: "Mới nhất",
  asc: "Giá thấp → cao",
  desc: "Giá cao → thấp",
} as const;
const PER_PAGE = 9;

/** Figma: listing page "Filter bar" + "Results" + pagination. Filters live in the URL so results are shareable. */
export default function ListingBrowser({
  items,
  label,
  typeSlug,
}: {
  items: Property[];
  label: string;
  typeSlug: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) ?? "";

  const set = (k: string, v: string) => {
    const q = new URLSearchParams(sp.toString());
    if (v) q.set(k, v);
    else q.delete(k);
    if (k !== "page") q.delete("page");
    router.replace(`/properties/${typeSlug}${q.size ? `?${q}` : ""}`, {
      scroll: false,
    });
  };

  const filtered = useMemo(() => {
    const kw = get("q").toLowerCase();
    const min = Number(get("min")) || 0;
    const max = Number(get("max")) || Infinity;
    const beds = Number(get("beds")) || 0;
    const baths = Number(get("baths")) || 0;
    const district = get("district");
    const out = items.filter(
      (p) =>
        (!kw ||
          `${p.title} ${p.code} ${p.district}`.toLowerCase().includes(kw)) &&
        p.priceMillion >= min &&
        p.priceMillion <= max &&
        (p.bedrooms ?? 0) >= beds &&
        (p.bathrooms ?? 0) >= baths &&
        (!district || p.district === district),
    );
    const sort = get("sort");
    if (sort === "asc") out.sort((a, b) => a.priceMillion - b.priceMillion);
    else if (sort === "desc")
      out.sort((a, b) => b.priceMillion - a.priceMillion);
    else out.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sp]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(get("page")) || 1));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const active = ["q", "district", "beds", "baths", "min", "max"].filter((k) =>
    get(k),
  );

  const chip =
    "flex h-[38px] items-center gap-1.5 rounded-full border border-line bg-white pl-3.5 pr-2.5 text-[13px] font-medium text-esp focus:outline-none focus:ring-2 focus:ring-gold";
  return (
    <>
      <div className="gutter sticky top-[93px] z-30 flex flex-wrap items-center justify-between gap-3 border-y border-lineL bg-white py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-[38px] items-center gap-1.5 rounded-full bg-esp px-3.5 text-[13px] font-medium text-white">
            <Icon name="filter" size={14} /> Lọc
          </span>
          <select
            aria-label="Phân khu"
            className={chip}
            value={get("district")}
            onChange={(e) => set("district", e.target.value)}
          >
            <option value="">Phân khu</option>
            {DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            aria-label="Phòng ngủ"
            className={chip}
            value={get("beds")}
            onChange={(e) => set("beds", e.target.value)}
          >
            <option value="">Phòng ngủ</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+ PN
              </option>
            ))}
          </select>
          <select
            aria-label="Khoảng giá"
            className={chip}
            value={`${get("min")}-${get("max")}`}
            onChange={(e) => {
              const [mn, mx] = e.target.value.split("-");
              const q = new URLSearchParams(sp.toString());
              if (mn) q.set("min", mn);
              else q.delete("min");
              if (mx) q.set("max", mx);
              else q.delete("max");
              q.delete("page");
              router.replace(`/properties/${typeSlug}?${q}`, { scroll: false });
            }}
          >
            <option value="-">Khoảng giá</option>
            {typeSlug === "for-rent" ? (
              <>
                <option value="0-10">Dưới 10 triệu</option>
                <option value="10-20">10 – 20 triệu</option>
                <option value="20-">Trên 20 triệu</option>
              </>
            ) : (
              <>
                <option value="0-3000">Dưới 3 tỷ</option>
                <option value="3000-10000">3 – 10 tỷ</option>
                <option value="10000-">Trên 10 tỷ</option>
              </>
            )}
          </select>
          <label className={`${chip} pr-3.5`}>
            <Icon name="search" size={14} />
            <input
              aria-label="Từ khóa"
              placeholder="Từ khóa, mã căn"
              defaultValue={get("q")}
              onKeyDown={(e) =>
                e.key === "Enter" && set("q", e.currentTarget.value.trim())
              }
              className="w-32 bg-transparent focus:outline-none"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-muted">Sắp xếp:</span>
          <select
            aria-label="Sắp xếp"
            className={chip}
            value={get("sort") || "new"}
            onChange={(e) =>
              set("sort", e.target.value === "new" ? "" : e.target.value)
            }
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="gutter flex flex-col gap-6 bg-page pb-16 pt-7">
        {active.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-muted">Đang lọc:</span>
            {active.map((k) => (
              <button
                key={k}
                onClick={() => set(k, "")}
                className="rounded-full bg-cream px-3 py-1.5 text-[12px] font-medium text-esp"
              >
                {k === "district" ? get(k) : `${k}: ${get(k)}`} ✕
              </button>
            ))}
            <Link
              href={`/properties/${typeSlug}`}
              className="text-[12px] font-semibold text-gold"
            >
              Xóa tất cả
            </Link>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-muted" aria-live="polite">
            {filtered.length} căn {label.toLowerCase()}
          </p>
          <AlertButton
            typeSlug={typeSlug}
            filters={{
              district: get("district"),
              min: get("min"),
              max: get("max"),
              beds: get("beds"),
              q: get("q"),
            }}
          />
        </div>
        {shown.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((p) => (
              <li key={p.code} className="flex">
                <ListingCard p={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-white px-6 py-16 text-center text-muted">
            Không có căn phù hợp với bộ lọc. Thử bỏ bớt điều kiện hoặc gửi nhu
            cầu cho anh Tuấn bên dưới.
          </div>
        )}
        {pages > 1 && (
          <nav
            className="flex justify-center gap-1.5 pt-3"
            aria-label="Phân trang"
          >
            {Array.from({ length: pages }, (_, k) => k + 1).map((n) => (
              <button
                key={n}
                onClick={() => set("page", String(n))}
                aria-current={n === page}
                className={`size-[38px] rounded text-[14px] font-semibold ${n === page ? "bg-esp text-white" : "border border-line bg-white text-esp"}`}
              >
                {n}
              </button>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
