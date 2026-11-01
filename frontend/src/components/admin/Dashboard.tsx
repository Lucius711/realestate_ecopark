"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../Icons";
import { TONE } from "./fields";
import { PROPERTY_STATUS } from "./resources";
import { adminFetch } from "@/lib/adminApi";
import { displayName, type Me } from "@/lib/auth";

type Lead = { id: number; name: string; phone: string; source: string; propertyCode: string | null; status: string; createdAt: string };
type Data = { leads: Lead[]; props: { status: string }[]; projects: number; slides: number; customers: number };

const source = (s: string) => (s === "detail" ? "Đặt lịch xem" : s === "footer" ? "Liên hệ" : s.startsWith("brochure:") ? "Tải brochure" : s.startsWith("project:") ? "Bảng giá dự án" : s);
const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${Math.max(m, 1)} phút trước` : m < 1440 ? `${Math.round(m / 60)} giờ trước` : `${Math.round(m / 1440)} ngày trước`;
};

/** Start page: what needs doing today (new requests to call back), listing status at a glance, one-click shortcuts. */
export default function Dashboard({ me }: { me: Me }) {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const n = <T,>(p: string) => adminFetch<T[]>(p);
      const [leads, props, projects, slides, customers] = await Promise.all([
        n<Lead>("/admin/leads"),
        n<{ status: string }>("/admin/properties"),
        n("/admin/projects"),
        n<{ active: boolean }>("/admin/slides"),
        n("/admin/customers"),
      ]);
      setD({ leads, props, projects: projects.length, slides: slides.filter((s) => s.active).length, customers: customers.length });
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function markCalled(l: Lead) {
    setD((x) => x && { ...x, leads: x.leads.map((y) => (y.id === l.id ? { ...y, status: "contacted" } : y)) });
    await adminFetch(`/admin/leads/${l.id}`, { method: "PUT", body: { status: "contacted" } }).catch((e) => {
      setErr((e as Error).message);
      load();
    });
  }

  const fresh = (d?.leads ?? []).filter((l) => l.status === "new");
  const hour = new Date().getHours();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold text-esp">
            {hour < 11 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối"}, {displayName(me)}
          </h1>
          <p className="text-[13px] text-muted">Mọi thay đổi hiện trên website sau khoảng 1 phút.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/properties?new=1" className="btn-gold h-11 !py-0">
            + ĐĂNG CĂN MỚI
          </Link>
          <Link href="/" target="_blank" className="btn h-11 border border-esp !py-0 text-esp hover:bg-white">
            XEM WEBSITE ↗
          </Link>
        </div>
      </div>
      {err && <p className="rounded border border-price/30 bg-price/5 px-4 py-3 text-[13px] text-price">{err}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* 1. Today's to-do: new requests waiting for a call back */}
        <section className="flex flex-col gap-4 rounded-lg border border-lineL bg-white p-5" aria-labelledby="todo-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="todo-title" className="flex items-center gap-2 text-[16px] font-bold text-esp">
              Khách đang chờ gọi lại
              <span className={`rounded-full px-2 py-0.5 text-[12px] ${fresh.length ? "bg-price text-white" : "bg-page text-muted"}`}>{d ? fresh.length : "…"}</span>
            </h2>
            <Link href="/admin/leads" className="text-[12px] font-semibold text-gold hover:text-esp">
              Tất cả yêu cầu →
            </Link>
          </div>
          {!d ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded bg-page" />
              ))}
            </div>
          ) : !fresh.length ? (
            <p className="rounded bg-[#E8F3EC] px-4 py-5 text-center text-[13px] text-verified">✓ Đã liên hệ hết khách. Yêu cầu mới từ website sẽ hiện ở đây.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-lineL">
              {fresh.slice(0, 6).map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[14px] font-semibold text-ink">{l.name}</span>
                    <span className="text-[12px] text-muted">
                      {source(l.source)}
                      {l.propertyCode && ` · ${l.propertyCode}`} · {ago(l.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 rounded border border-esp px-3 py-2 text-[13px] font-semibold text-esp hover:bg-cream">
                      <Icon name="phone" size={13} /> {l.phone}
                    </a>
                    <button onClick={() => markCalled(l)} className="rounded bg-esp px-3 py-2 text-[13px] font-semibold text-white hover:brightness-125">
                      Đã gọi ✓
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {fresh.length > 6 && <p className="text-[12px] text-muted">Còn {fresh.length - 6} yêu cầu nữa trong mục Khách hàng.</p>}
        </section>

        {/* 2. Listings by status — each tile opens the filtered table */}
        <section className="flex flex-col gap-4 rounded-lg border border-lineL bg-white p-5" aria-labelledby="stock-title">
          <div className="flex items-center justify-between">
            <h2 id="stock-title" className="text-[16px] font-bold text-esp">
              Căn của anh
            </h2>
            <Link href="/admin/properties" className="text-[12px] font-semibold text-gold hover:text-esp">
              Quản lý căn →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PROPERTY_STATUS.map((o) => (
              <Link key={o.value} href={`/admin/properties?status=${o.value}`} className={`flex flex-col gap-1 rounded-md border-l-4 bg-page p-4 hover:bg-cream ${TONE[o.tone ?? "gray"].card.split(" ")[0]}`}>
                <span className="text-[28px] font-extrabold leading-none text-esp">{d ? d.props.filter((p) => p.status === o.value).length : "…"}</span>
                <span className="text-[12px] font-semibold text-muted">{o.label}</span>
              </Link>
            ))}
          </div>
          <p className="text-[12px] text-muted">Căn đã chốt? Chuyển sang “Đã bán / đã cho thuê” ngay trong bảng — không cần xoá.</p>
        </section>
      </div>

      {/* 3. Everything else, one click away */}
      <section aria-labelledby="more-title" className="flex flex-col gap-3">
        <h2 id="more-title" className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
          Nội dung khác
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/admin/projects", icon: "map" as const, label: "Dự án", value: d?.projects, hint: "Trang dự án, brochure" },
            { href: "/admin/slides", icon: "image" as const, label: "Slider trang chủ", value: d?.slides, hint: "slide đang chạy" },
            { href: "/admin/leads", icon: "user" as const, label: "Tài khoản khách", value: d?.customers, hint: "khách đã đăng ký" },
            { href: "/admin/videos", icon: "play" as const, label: "Video & đánh giá", value: undefined, hint: "TikTok, YouTube, cảm nhận khách" },
          ].map((s) => (
            <Link key={s.href + s.label} href={s.href} className="flex items-center gap-3 rounded-lg border border-lineL bg-white p-4 hover:border-gold">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold">
                <Icon name={s.icon} size={18} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[14px] font-semibold text-esp">
                  {s.label}
                  {s.value !== undefined && <span className="ml-1.5 text-muted">({s.value})</span>}
                </span>
                <span className="truncate text-[12px] text-muted">{s.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
