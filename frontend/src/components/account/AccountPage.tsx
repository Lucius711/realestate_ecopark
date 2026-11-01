"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import ListingCard from "../ListingCard";
import Empty from "../Empty";
import { Icon } from "../Icons";
import { apiFetch, displayName, isAdmin, token, useFavorites, useMe, type Me } from "@/lib/auth";
import type { Property } from "@/lib/types";

type LeadRow = { id: number; source: string; propertyCode: string | null; message: string | null; status: "new" | "contacted" | "closed"; createdAt: string };
export type Alert = { id: number; type: "rent" | "resale" | "project"; district: string | null; minPrice: number | null; maxPrice: number | null; minBeds: number | null; keyword: string | null };

const TYPE = { rent: "Nhà cho thuê", resale: "Nhà chuyển nhượng", project: "Hàng dự án" } as const;
const DISTRICTS = ["Rừng Cọ", "Quận Đảo", "Giáo dục", "Sân Golf", "Sáng tạo", "Aquabay"];
const STATUS = {
  new: { label: "Đã nhận", cls: "bg-cream text-esp" },
  contacted: { label: "Đã liên hệ", cls: "bg-[#E7F0FB] text-[#1F5FAD]" },
  closed: { label: "Hoàn tất", cls: "bg-[#E8F3EC] text-verified" },
};
const sourceLabel = (s: string) =>
  s === "detail" ? "Đặt lịch xem nhà" : s === "footer" ? "Liên hệ tư vấn" : s.startsWith("brochure:") ? `Tải brochure ${s.slice(9)}` : s.startsWith("project:") ? `Nhận bảng giá ${s.slice(8)}` : s;
const money = (m: number, type: Alert["type"]) => (type === "rent" ? `${m} triệu/tháng` : m >= 1000 ? `${(m / 1000).toLocaleString("vi-VN")} tỷ` : `${m} triệu`);
export const describeAlert = (a: Alert) =>
  [
    TYPE[a.type],
    a.district && `phân khu ${a.district}`,
    a.minPrice != null && a.maxPrice != null ? `${money(a.minPrice, a.type)} – ${money(a.maxPrice, a.type)}` : a.minPrice != null ? `từ ${money(a.minPrice, a.type)}` : a.maxPrice != null ? `đến ${money(a.maxPrice, a.type)}` : null,
    a.minBeds != null && `${a.minBeds}+ phòng ngủ`,
    a.keyword && `"${a.keyword}"`,
  ]
    .filter(Boolean)
    .join(" · ");

const card = "flex scroll-mt-28 flex-col gap-5 rounded-lg border border-lineL bg-white p-6 md:p-8";
const h2 = "text-[20px] font-extrabold text-esp";
const input = "h-11 w-full rounded border border-line bg-white px-3.5 text-[14px] focus:border-gold focus:outline-none";
const label = "flex flex-col gap-1.5 text-[13px] font-semibold text-esp";

/** Shown under the email field: unverified addresses get no alerts until the emailed link is clicked. */
function EmailStatus({ me }: { me: Me }) {
  const [sent, setSent] = useState<string | null>(null);
  // ?email=verified|invalid comes back from the link in the verification email
  const [result] = useState(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("email")));
  if (!me.email) return null;
  if (me.emailVerified) return <span className="text-[12px] font-medium text-verified">✓ Đã xác minh{result === "verified" && " — bạn sẽ nhận thông báo căn mới"}</span>;
  async function resend() {
    try {
      await apiFetch("/me/verify-email", { method: "POST" });
      setSent(`Đã gửi link xác minh tới ${me.email}.`);
    } catch (e) {
      setSent((e as Error).message);
    }
  }
  return (
    <span className="text-[12px] font-medium text-price">
      {result === "invalid" ? "Link xác minh không hợp lệ hoặc đã hết hạn." : "Chưa xác minh — kiểm tra hộp thư để nhận thông báo căn mới."}{" "}
      {sent ?? (
        <button type="button" onClick={resend} className="font-semibold text-gold underline">
          Gửi lại email
        </button>
      )}
    </span>
  );
}

function Profile({ me }: { me: Me }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await apiFetch("/me/profile", { method: "PUT", body: { fullName: String(f.get("fullName")), phone: String(f.get("phone")), ...(isAdmin(me) ? {} : { email: String(f.get("email")) }) } });
      token.refresh(); // forms across the site pick up the new details
      const newEmail = String(f.get("email") ?? "").trim().toLowerCase();
      setMsg({ ok: true, text: !isAdmin(me) && newEmail && newEmail !== me.email ? "Đã lưu hồ sơ. Kiểm tra email để xác minh địa chỉ mới." : "Đã lưu hồ sơ." });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="profile" className={card}>
      <h2 className={h2}>Hồ sơ</h2>
      <p className="-mt-3 text-[13px] text-muted">Dùng để điền sẵn khi bạn đặt lịch xem nhà, tải brochure hay gửi liên hệ.</p>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-3">
        <label className={label}>
          Họ và tên
          <input name="fullName" defaultValue={me.fullName ?? ""} maxLength={80} autoComplete="name" className={input} />
        </label>
        <label className={label}>
          Số điện thoại
          <input name="phone" type="tel" defaultValue={me.phone ?? ""} maxLength={20} autoComplete="tel" className={input} />
        </label>
        <label className={label}>
          Email {isAdmin(me) && <span className="font-normal text-soft">(đổi qua quản trị viên)</span>}
          <input name="email" type="email" defaultValue={me.email ?? ""} maxLength={120} autoComplete="email" readOnly={isAdmin(me)} className={`${input} read-only:bg-page`} />
          <EmailStatus me={me} />
        </label>
        <div className="flex items-center gap-4 md:col-span-3">
          <button disabled={busy} className="btn-dark disabled:opacity-60">
            {busy ? "ĐANG LƯU…" : "LƯU HỒ SƠ"}
          </button>
          {msg && (
            <span role="status" className={`text-[13px] ${msg.ok ? "text-verified" : "text-price"}`}>
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function Saved() {
  const { favs } = useFavorites();
  const [list, setList] = useState<Property[] | null>(null);
  useEffect(() => {
    apiFetch<Property[]>("/me/favorites").then(setList).catch(() => setList([]));
  }, []);
  const shown = (list ?? []).filter((p) => favs.has(p.code)); // un-♡ on a card removes it here at once
  return (
    <section id="saved" className={card}>
      <h2 className={h2}>Căn đã lưu {list && <span className="text-[14px] font-medium text-muted">({shown.length})</span>}</h2>
      {list === null ? (
        <p className="text-[13px] text-muted">Đang tải…</p>
      ) : shown.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <li key={p.code} className="flex">
              <ListingCard p={p} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty>
          Chưa lưu căn nào — bấm ♡ trên căn bạn thích.{" "}
          <Link href="/properties/for-rent" className="font-semibold text-gold">
            Xem căn
          </Link>
        </Empty>
      )}
    </section>
  );
}

function Requests() {
  const [rows, setRows] = useState<LeadRow[] | null>(null);
  useEffect(() => {
    apiFetch<LeadRow[]>("/me/leads").then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <section id="requests" className={card}>
      <h2 className={h2}>Yêu cầu của tôi</h2>
      {rows === null ? (
        <p className="text-[13px] text-muted">Đang tải…</p>
      ) : rows.length ? (
        <ul className="divide-y divide-lineL">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-ink">
                  {sourceLabel(r.source)}
                  {r.propertyCode && (
                    <>
                      {" · "}
                      <Link href={`/property/${r.propertyCode}`} className="text-gold hover:text-esp">
                        {r.propertyCode}
                      </Link>
                    </>
                  )}
                </span>
                <span className="text-[12px] text-muted">
                  {new Date(r.createdAt).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}
                  {r.message && ` · ${r.message}`}
                </span>
              </div>
              <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Chưa có yêu cầu nào. Lịch xem nhà, liên hệ và brochure bạn gửi khi đã đăng nhập sẽ hiện ở đây.</Empty>
      )}
    </section>
  );
}

function Alerts({ me }: { me: Me }) {
  const [rows, setRows] = useState<Alert[] | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => apiFetch<Alert[]>("/me/searches").then(setRows).catch(() => setRows([])), []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const num = (k: string) => (String(f.get(k)).trim() ? Number(String(f.get(k)).replace(",", ".")) : undefined);
    setErr("");
    try {
      await apiFetch("/me/searches", {
        method: "POST",
        body: { type: f.get("type"), district: f.get("district") || undefined, minPrice: num("minPrice"), maxPrice: num("maxPrice"), minBeds: num("minBeds"), keyword: String(f.get("keyword")).trim() || undefined },
      });
      form.reset();
      load();
    } catch (er) {
      setErr((er as Error).message);
    }
  }
  async function remove(id: number) {
    await apiFetch(`/me/searches/${id}`, { method: "DELETE" }).catch(() => null);
    load();
  }

  return (
    <section id="alerts" className={card}>
      <div>
        <h2 className={h2}>Thông báo căn mới</h2>
        <p className="mt-1 text-[13px] text-muted">
          Có căn mới đúng tiêu chí, chúng tôi gửi email tới <b className="text-esp">{me.email ?? "— (thêm email ở Hồ sơ)"}</b>.
        </p>
      </div>
      {rows && rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded border border-lineL bg-page px-4 py-3 text-[13px]">
              <span className="flex items-center gap-2 text-ink">
                <Icon name="mail" size={15} className="text-gold" /> {describeAlert(a)}
              </span>
              <button onClick={() => remove(a.id)} className="text-[12px] font-semibold text-price">
                Tắt
              </button>
            </li>
          ))}
        </ul>
      )}
      {rows && !rows.length && <Empty>Chưa bật thông báo nào. Thêm tiêu chí bên dưới, hoặc bấm “Nhận thông báo căn mới” ở trang danh sách.</Empty>}
      <form onSubmit={add} className="grid gap-3 rounded border border-dashed border-line p-4 md:grid-cols-6">
        <select name="type" aria-label="Loại" className={`${input} md:col-span-2`}>
          {Object.entries(TYPE).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select name="district" aria-label="Phân khu" className={`${input} md:col-span-2`}>
          <option value="">Mọi phân khu</option>
          {DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <input name="minBeds" inputMode="numeric" placeholder="Phòng ngủ từ" aria-label="Số phòng ngủ tối thiểu" className={`${input} md:col-span-2`} />
        <input name="minPrice" inputMode="decimal" placeholder="Giá từ (triệu)" aria-label="Giá từ (triệu đồng)" className={`${input} md:col-span-2`} />
        <input name="maxPrice" inputMode="decimal" placeholder="Giá đến (triệu)" aria-label="Giá đến (triệu đồng)" className={`${input} md:col-span-2`} />
        <input name="keyword" maxLength={60} placeholder="Từ khoá (tuỳ chọn)" aria-label="Từ khoá" className={`${input} md:col-span-2`} />
        <div className="flex items-center gap-3 md:col-span-6">
          <button className="btn-gold">+ BẬT THÔNG BÁO</button>
          {err && (
            <span role="alert" className="text-[13px] text-price">
              {err}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

/** /account — member area: profile (pre-fills forms), ♡ saved listings, request history, new-listing alerts. */
export default function AccountPage() {
  const me = useMe();
  const router = useRouter();
  useEffect(() => {
    if (me === null) router.replace("/login?next=/account");
  }, [me, router]);
  if (!me)
    return (
      <p className="gutter py-24 text-center text-[14px] text-muted" role="status">
        Đang tải tài khoản…
      </p>
    );

  const nav = [
    ["#profile", "Hồ sơ"],
    ["#saved", "Căn đã lưu"],
    ["#requests", "Yêu cầu của tôi"],
    ["#alerts", "Thông báo căn mới"],
  ];
  return (
    <div className="gutter flex flex-col gap-6 bg-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tài khoản của tôi</p>
          <h1 className="text-[30px] font-extrabold text-esp">Xin chào, {displayName(me)}</h1>
        </div>
        <div className="flex gap-2">
          {isAdmin(me) && (
            <Link href="/admin" className="btn-gold">
              TRANG QUẢN TRỊ
            </Link>
          )}
          <button
            onClick={() => {
              token.set(null);
              window.location.href = "/"; // full navigation, so the "signed out → /login" redirect below doesn't win
            }}
            className="btn border border-esp text-esp hover:bg-white"
          >
            ĐĂNG XUẤT
          </button>
        </div>
      </div>
      <nav className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Mục tài khoản">
        {nav.map(([href, l]) => (
          <a key={href} href={href} className="whitespace-nowrap rounded-full border border-line bg-white px-4 py-2 text-[13px] font-semibold text-esp hover:bg-cream">
            {l}
          </a>
        ))}
      </nav>
      <Profile me={me} />
      <Saved />
      <Requests />
      <Alerts me={me} />
    </div>
  );
}
