import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import ListingCard from "@/components/ListingCard";
import MapEmbed from "@/components/MapEmbed";
import BrochureDownload from "@/components/project/BrochureDownload";
import { Icon } from "@/components/Icons";
import Empty from "@/components/Empty";
import { getProject, getProperties, seedProjects } from "@/lib/api";

export const revalidate = 60;
export const generateStaticParams = () =>
  seedProjects.map((p) => ({ slug: p.slug }));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const p = await getProject((await params).slug);
  return p
    ? { title: `Dự án ${p.name} – ${p.location}`, description: p.summary }
    : {};
}

const eyebrow = "text-[14px] font-bold tracking-[0.06em] text-esp";
const h2 =
  "text-[34px] font-extrabold uppercase leading-[1.1] text-esp md:text-[44px]";

/**
 * Figma 136:1794 "V2 — Dự án Eco Retreat".
 * Order requested by the client: Thông tin dự án (hero → tổng quan → loại hình → tiện ích) → Bản đồ → Chính sách → Hàng dự án.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await getProject((await params).slug);
  if (!p) notFound();
  const units = (await getProperties("project")).filter(
    (u) => u.projectSlug === p.slug,
  );

  return (
    <Shell>
      {/* 1. Thông tin dự án */}
      <header className="relative flex min-h-[514px] items-center overflow-hidden">
        <Image
          src={p.heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        <div className="gutter relative flex w-full flex-col gap-4 py-16 text-white">
          <p className="text-[12px] font-bold tracking-[0.12em] text-goldL">
            DỰ ÁN ĐANG MỞ BÁN · {p.location.toUpperCase()}
          </p>
          <h1 className="text-[48px] font-extrabold leading-none md:text-[76px]">
            {p.name}
          </h1>
          <p className="max-w-[560px] text-[16px] leading-relaxed text-white/90">
            {p.summary}
          </p>
          <div className="flex flex-wrap gap-3 pt-3">
            <a
              href={p.brochure ? "#brochure" : "#contact"}
              className="btn-gold"
            >
              {p.brochure ? "TẢI BROCHURE" : "NHẬN BẢNG GIÁ"}{" "}
              <Icon name="arrow" size={14} />
            </a>
            <a href="#contact" className="btn-ghost">
              ĐĂNG KÝ THAM QUAN
            </a>
          </div>
        </div>
      </header>

      <dl className="gutter grid grid-cols-2 gap-y-6 bg-esp py-10 empty:hidden text-center md:grid-cols-5 md:divide-x md:divide-white/15">
        {p.facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-1 px-2">
            <dd className="text-[20px] font-bold text-goldL md:text-[24px]">
              {f.value}
            </dd>
            <dt className="text-[12px] text-soft">{f.label}</dt>
          </div>
        ))}
      </dl>

      <section
        id="overview"
        className="gutter grid items-center gap-10 bg-cream py-20 lg:grid-cols-[1fr_620px]"
      >
        <div className="flex flex-col gap-5">
          <p className={eyebrow}>TỔNG QUAN</p>
          <h2 className={`${h2} max-w-[360px]`}>{p.tagline || p.name}</h2>
          <p className="whitespace-pre-line text-[14px] leading-[1.85] text-muted">
            {p.overview}
          </p>
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <Icon name="pin" size={15} className="text-gold" /> {p.address}
          </p>
        </div>
        <div className="relative aspect-[620/440] overflow-hidden rounded">
          <Image
            src={p.overviewImage || p.heroImage}
            alt={`Phối cảnh ${p.name}`}
            fill
            sizes="(min-width:1024px) 620px, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="gutter flex flex-col items-center gap-10 bg-white py-20">
        <div className="text-center">
          <p className={eyebrow}>SẢN PHẨM</p>
          <h2 className={h2}>Loại hình</h2>
        </div>
        {!p.productTypes.length && (
          <div className="w-full">
            <Empty>Chưa có thông tin loại hình.</Empty>
          </div>
        )}
        <ul className="grid w-full gap-6 md:grid-cols-3">
          {p.productTypes.map((t) => (
            <li
              key={t.name}
              className="group relative h-[420px] overflow-hidden rounded"
            >
              <Image
                src={t.image}
                alt=""
                fill
                sizes="(min-width:768px) 33vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-7 bottom-7 flex flex-col gap-1.5 text-white">
                <h3 className="text-[24px] font-extrabold">{t.name}</h3>
                <p className="text-[13px] text-white/85">{t.description}</p>
                <a
                  href="#units"
                  className="text-[12px] text-goldL after:absolute after:inset-0"
                >
                  Xem bảng giá →
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="gutter flex flex-col gap-6 bg-cream py-16">
        <h2 className="text-[26px] font-extrabold text-esp">
          TIỆN ÍCH NỔI BẬT
        </h2>
        {!p.amenities.length && <Empty>Chưa có thông tin tiện ích.</Empty>}
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {p.amenities.map((a) => (
            <li
              key={a.name}
              className="group relative aspect-[4/3] overflow-hidden rounded"
            >
              <Image
                src={a.image}
                alt=""
                fill
                sizes="(min-width:768px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <p className="absolute inset-x-4 bottom-4 text-[14px] font-bold text-white md:text-[16px]">
                {a.name}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* 2. Bản đồ */}
      <section
        id="location"
        className="gutter flex flex-col gap-6 bg-white py-20"
      >
        <div>
          <p className={eyebrow}>VỊ TRÍ</p>
          <h2 className={h2}>Bản đồ dự án</h2>
        </div>
        <MapEmbed
          query={p.mapQuery}
          title={`Bản đồ ${p.name}`}
          className="h-[460px]"
        />
      </section>

      {/* 3. Chính sách */}
      <section
        id="policies"
        className="gutter flex flex-col gap-8 bg-esp py-20 text-white"
      >
        <div>
          <p className="text-[14px] font-bold tracking-[0.06em] text-goldL">
            CHÍNH SÁCH BÁN HÀNG
          </p>
          <h2 className="text-[34px] font-extrabold uppercase md:text-[44px]">
            Ưu đãi & thanh toán
          </h2>
        </div>
        {!p.policies.length && <Empty dark>Chưa có chính sách bán hàng.</Empty>}
        <ol className="grid gap-5 md:grid-cols-3">
          {p.policies.map((pol, i) => (
            <li
              key={pol.title}
              className="flex flex-col overflow-hidden rounded border border-white/15 bg-esp2"
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src={pol.image}
                  alt=""
                  fill
                  sizes="(min-width:768px) 33vw, 100vw"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 rounded-sm bg-gold px-2.5 py-1 text-[12px] font-bold">
                  0{i + 1}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-7">
                <h3 className="text-[18px] font-bold">{pol.title}</h3>
                <p className="text-[14px] leading-relaxed text-[#D8CDBE]">
                  {pol.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {p.sourceNote && (
          <p className="text-[12px] text-soft">{p.sourceNote}</p>
        )}
      </section>

      {/* 4. Hàng dự án */}
      <section id="units" className="gutter flex flex-col gap-8 bg-page py-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={eyebrow}>HÀNG DỰ ÁN</p>
            <h2 className={h2}>Căn đang mở bán</h2>
          </div>
          <Link
            href="/properties/projects"
            className="text-[13px] font-semibold text-gold"
          >
            Tất cả hàng dự án →
          </Link>
        </div>
        {units.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {units.map((u) => (
              <li key={u.code} className="flex">
                <ListingCard p={u} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded border border-dashed border-line bg-white px-6 py-12 text-center text-muted">
            Đang cập nhật bảng hàng — để lại số điện thoại để nhận sớm nhất.
          </p>
        )}
      </section>

      {p.brochure ? (
        <BrochureDownload slug={p.slug} name={p.name} file={p.brochure} />
      ) : (
        <section className="gutter flex flex-wrap items-center justify-between gap-6 bg-gold py-12 text-white">
          <div className="flex flex-col gap-1">
            <h2 className="text-[26px] font-bold">
              Nhận bảng giá & chính sách mới nhất
            </h2>
            <p className="text-[13px] text-white/85">
              Để lại số điện thoại, anh Tuấn gửi tài liệu dự án qua Zalo trong
              24 giờ.
            </p>
          </div>
          <a href="#contact" className="btn-dark">
            NHẬN TÀI LIỆU <Icon name="arrow" size={14} />
          </a>
        </section>
      )}
    </Shell>
  );
}
