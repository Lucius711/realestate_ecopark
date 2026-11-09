import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Shell from "@/components/Shell";
import ListingBrowser from "@/components/listing/ListingBrowser";
import RequestCta from "@/components/listing/RequestCta";
import { getDistricts, getProperties, SLUG_TYPE } from "@/lib/api";

const LABEL: Record<string, string> = { "for-rent": "Nhà cho thuê", "resale": "Nhà chuyển nhượng", "projects": "Hàng dự án" };

export const revalidate = 60;
export const generateStaticParams = () => Object.keys(LABEL).map((type) => ({ type }));
export const generateMetadata = async ({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> => ({ title: `${LABEL[(await params).type] ?? "Bất động sản"} tại Ecopark` });

/** Figma: "V2 — Danh sách / NHÀ CHO THUÊ | NHÀ CHUYỂN NHƯỢNG | HÀNG DỰ ÁN". */
export default async function ListingPage(props: { params: Promise<{ type: string }> }) {
  const params = await props.params;
  const type = SLUG_TYPE[params.type];
  if (!type) notFound();
  const [items, districts] = await Promise.all([getProperties(type), getDistricts()]);
  const label = LABEL[params.type];

  return (
    <Shell>
      <header className="gutter flex flex-col gap-2 bg-white pb-7 pt-9">
        <nav className="text-[12px] text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-esp">
            Trang chủ
          </Link>
          {"  ›  "}Bất động sản{"  ›  "}
          {label}
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[30px] font-extrabold text-esp md:text-[38px]">{label} tại Ecopark</h1>
            <p className="text-[14px] text-muted">Hiện có {items.length} căn · cập nhật hôm nay</p>
          </div>
          <div className="flex gap-1 rounded-full bg-cream p-1" role="tablist">
            {Object.entries(LABEL).map(([slug, l]) => (
              <Link key={slug} href={`/properties/${slug}`} role="tab" aria-selected={slug === params.type} className={`rounded-full px-4 py-[9px] text-[13px] font-semibold ${slug === params.type ? "bg-esp text-white" : "text-esp hover:bg-white"}`}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <Suspense>
        <ListingBrowser items={items} districts={districts} label={label} typeSlug={params.type} />
      </Suspense>
      <RequestCta />
    </Shell>
  );
}
