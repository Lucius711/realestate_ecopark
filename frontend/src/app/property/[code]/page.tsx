import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import Gallery from "@/components/detail/Gallery";
import AgentCard from "@/components/detail/AgentCard";
import ListingCard from "@/components/ListingCard";
import MapEmbed from "@/components/MapEmbed";
import { Icon, type IconName } from "@/components/Icons";
import Empty from "@/components/Empty";
import FavoriteButton from "@/components/FavoriteButton";
import {
  getProperties,
  getProperty,
  seedProperties,
  TYPE_SLUG,
} from "@/lib/api";
import { areaLabel, feePerM2, pricePerM2, TYPE_LABEL } from "@/lib/format";
import { LIVING_COSTS } from "@/lib/living-costs";
import { videoFromUrl, verifiedLabel } from "@/lib/video";

export const revalidate = 60;
export const generateStaticParams = () =>
  seedProperties.map((p) => ({ code: p.code }));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const p = await getProperty((await params).code);
  return p
    ? {
        title: `${p.title} – ${p.priceLabel}`,
        description: p.description,
        openGraph: { images: [p.images[0]] },
      }
    : {};
}

const AMENITIES = [
  "Bể bơi",
  "Gym",
  "Siêu thị",
  "Công viên",
  "Trường học",
  "Bãi đỗ xe",
  "An ninh 24/7",
  "Thang máy",
];
const TYPE_NAME = {
  rent: "Nhà cho thuê",
  resale: "Nhà chuyển nhượng",
  project: "Hàng dự án",
} as const;

/** Figma 153:2366 "V2 — Chi tiết căn". */
export default async function DetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const p = await getProperty((await params).code);
  if (!p) notFound();
  // Same district first: for a sold / deposited listing these are the real alternatives.
  const similar = (await getProperties(p.type))
    .filter((x) => x.code !== p.code)
    .sort((a, b) => Number(b.district === p.district) - Number(a.district === p.district))
    .slice(0, 3);
  const typeSlug = TYPE_SLUG[p.type];

  const facts: [IconName, string, string | null | undefined][] = [
    ["area", "Diện tích", areaLabel(p)],
    ["bed", "Phòng ngủ", p.bedrooms != null ? `${p.bedrooms} phòng` : null],
    ["bath", "Phòng tắm", p.bathrooms != null ? `${p.bathrooms} phòng` : null],
    ["floor", "Tòa", p.building?.name],
    ["layers", "Tầng", p.floorLabel],
    ["compass", "Hướng", p.direction],
    ["sofa", "Nội thất", p.furniture],
    ["doc", "Pháp lý", p.legal],
  ];
  // Management fee comes from the building; the rest of the monthly costs are the same for every listing.
  const fee = p.building?.managementFee;
  const costs: [string, string][] = [
    ["Phí quản lý", fee ? `${feePerM2(fee)} (≈ ${Math.round(fee * p.areaM2).toLocaleString("vi-VN")}đ/tháng)` : "Theo BQL"],
    ...LIVING_COSTS.map((c): [string, string] => [c.label, c.value || "Liên hệ"]),
  ];

  const card =
    "flex flex-col gap-4 rounded-lg border border-lineL bg-white p-6";
  const h2 = "text-[18px] font-bold text-esp";
  return (
    <Shell>
      <div className="gutter flex flex-col gap-4 bg-white pb-4 pt-7">
        <nav className="text-[12px] text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-esp">
            Trang chủ
          </Link>
          {"  ›  "}
          <Link href={`/properties/${typeSlug}`} className="hover:text-esp">
            {TYPE_NAME[p.type]}
          </Link>
          {"  ›  "}
          {p.title}
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5 text-[10px] font-bold tracking-[0.08em] text-white">
              <span className="rounded-[3px] bg-gold px-2 py-1">
                {TYPE_LABEL[p.type]}
              </span>
              {p.status === "deposit" && <span className="rounded-[3px] bg-[#C98A1B] px-2 py-1">ĐÃ CỌC</span>}
              {p.status === "sold" && <span className="rounded-[3px] bg-esp px-2 py-1">ĐÃ GIAO DỊCH</span>}
              {p.verifiedAt && (
                <span title="Anh Tuấn đã trực tiếp kiểm tra căn này" className="rounded-[3px] bg-verified px-2 py-1">
                  ✓ {verifiedLabel(p.verifiedAt).toUpperCase()}
                </span>
              )}
              {p.legal && (
                <span className="rounded-[3px] bg-esp px-2 py-1">
                  {p.legal.toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-[26px] font-bold text-esp md:text-[34px]">
              {p.title}
            </h1>
            <p className="flex items-center gap-1.5 text-[13px] text-muted">
              <Icon name="pin" size={14} /> Phân khu {p.district}, Ecopark, Văn
              Giang, Hưng Yên
            </p>
          </div>
          <div className="flex gap-2 text-[13px] font-medium text-esp">
            <FavoriteButton code={p.code} withLabel className="flex items-center gap-1.5 rounded border border-esp px-4 py-2.5 hover:bg-cream aria-pressed:border-price aria-pressed:text-price" />
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://nguyentuanecopark.vn/property/${p.code}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded border border-esp px-4 py-2.5 hover:bg-cream"
            >
              <Icon name="share" size={15} /> Chia sẻ
            </a>
          </div>
        </div>
        <div className="pt-2">
          <Gallery
            images={p.images}
            title={p.title}
            video={videoFromUrl(p.videoUrl, `Video review ${p.title}`, p.images[0])}
          />
        </div>
      </div>

      <div className="gutter grid gap-6 bg-page py-8 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div className="flex flex-col gap-6">
          <section className={`${card} !flex-row flex-wrap gap-x-10`}>
            <div>
              <p className="text-[11px] text-muted">
                {p.type === "rent" ? "Giá thuê" : "Giá bán"}
              </p>
              <p className="text-[24px] font-bold text-price">{p.priceLabel}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Đơn giá</p>
              <p className="text-[24px] font-semibold text-esp">
                {pricePerM2(p)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Phí quản lý</p>
              <p className="text-[24px] font-semibold text-esp">{feePerM2(fee)}</p>
            </div>
          </section>

          <section className={card}>
            <h2 className={h2}>Đặc điểm căn hộ</h2>
            <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {facts
                .filter(([, , v]) => v)
                .map(([icon, label, v]) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded bg-creamT px-3.5 py-3"
                  >
                    <Icon
                      name={icon}
                      size={18}
                      className="shrink-0 text-gold"
                    />
                    <div>
                      <dt className="text-[10px] text-muted">{label}</dt>
                      <dd className="text-[13px] font-semibold text-ink">
                        {v}
                      </dd>
                    </div>
                  </div>
                ))}
            </dl>
          </section>

          <section className={card}>
            <h2 className={h2}>Chi phí hàng tháng</h2>
            <dl className="grid gap-2.5 sm:grid-cols-2">
              {costs.map(([label, v]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded bg-creamT px-3.5 py-3">
                  <dt className="text-[13px] text-muted">{label}</dt>
                  <dd className="text-right text-[13px] font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={card}>
            <h2 className={h2}>Mô tả</h2>
            <p className="whitespace-pre-line text-[14px] leading-[1.85] text-muted">
              {p.description}
            </p>
          </section>

          <section className={card}>
            <h2 className={h2}>Tiện ích</h2>
            <ul className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <li
                  key={a}
                  className="flex items-center gap-1.5 rounded-full border border-lineL bg-creamT px-3.5 py-1.5 text-[12px] text-ink"
                >
                  <Icon name="check" size={12} className="text-gold" /> {a}
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h2 className={h2}>Vị trí</h2>
            <MapEmbed
              query={`${p.district} Ecopark Văn Giang Hưng Yên`}
              title={`Bản đồ phân khu ${p.district}`}
              className="h-[320px]"
            />
          </section>
        </div>
        <AgentCard propertyCode={p.code} status={p.status} similarHref="#similar" />
      </div>

      {
        <section id="similar" className="gutter flex scroll-mt-28 flex-col gap-6 bg-page pb-16 pt-8">
          <div className="flex items-end justify-between">
            <h2 className="text-[28px] font-bold text-esp">Căn tương tự</h2>
            <Link
              href={`/properties/${typeSlug}`}
              className="text-[13px] font-semibold text-gold"
            >
              Xem tất cả →
            </Link>
          </div>
          {!similar.length && <Empty>Không có căn tương tự.</Empty>}
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {similar.map((s) => (
              <li key={s.code} className="flex">
                <ListingCard p={s} />
              </li>
            ))}
          </ul>
        </section>
      }
    </Shell>
  );
}
