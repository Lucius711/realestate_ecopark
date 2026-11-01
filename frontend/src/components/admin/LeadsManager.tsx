"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Empty from "../Empty";
import { Icon } from "../Icons";
import { adminFetch } from "@/lib/adminApi";

type Lead = { id: number; name: string; phone: string; email: string | null; message: string | null; source: string; propertyCode: string | null; status: "new" | "contacted" | "closed"; userId: number | null; createdAt: string };
type Customer = { id: number; username: string | null; email: string | null; fullName: string | null; phone: string | null; createdAt: string; favorites: string[]; alerts: number; requests: number };

const STATUS = { new: "Mới", contacted: "Đã liên hệ", closed: "Hoàn tất" } as const;
const STATUS_CLS = { new: "bg-[#FDECEA] text-price", contacted: "bg-[#E7F0FB] text-[#1F5FAD]", closed: "bg-[#E8F3EC] text-verified" };
const source = (s: string) =>
  s === "detail" ? "Đặt lịch xem" : s === "footer" ? "Liên hệ" : s.startsWith("brochure:") ? `Brochure · ${s.slice(9)}` : s.startsWith("project:") ? `Bảng giá · ${s.slice(8)}` : s;
const when = (d: string) => new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

/** Khách hàng: form requests (filter by status, update status inline) + signed-up customers and what they saved. */
export default function LeadsManager() {
  const [tab, setTab] = useState<"leads" | "customers">("leads");
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [filter, setFilter] = useState<"all" | Lead["status"]>("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [l, c] = await Promise.all([adminFetch<Lead[]>("/admin/leads"), adminFetch<Customer[]>("/admin/customers")]);
      setLeads(l);
      setCustomers(c);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => ({ all: leads?.length ?? 0, new: 0, contacted: 0, closed: 0, ...Object.fromEntries((["new", "contacted", "closed"] as const).map((s) => [s, leads?.filter((l) => l.status === s).length ?? 0])) }), [leads]);
  const shown = (leads ?? []).filter((l) => (filter === "all" || l.status === filter) && (!q || `${l.name} ${l.phone} ${l.email ?? ""} ${l.propertyCode ?? ""}`.toLowerCase().includes(q.toLowerCase())));

  async function setStatus(l: Lead, status: Lead["status"]) {
    setLeads((ls) => ls && ls.map((x) => (x.id === l.id ? { ...x, status } : x)));
    try {
      await adminFetch(`/admin/leads/${l.id}`, { method: "PUT", body: { status } });
    } catch (e) {
      setErr((e as Error).message);
      load();
    }
  }
  async function promote(c: Customer) {
    const who = c.fullName || c.username || c.email;
    if (!window.confirm(`Cấp quyền quản trị cho "${who}"?\nTài khoản này sẽ xem được khách hàng và sửa toàn bộ website.`)) return;
    try {
      await adminFetch(`/admin/customers/${c.id}/promote`, { method: "POST" });
      setErr("");
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  async function remove(l: Lead) {
    if (!window.confirm(`Xoá yêu cầu của "${l.name}"?`)) return;
    await adminFetch(`/admin/leads/${l.id}`, { method: "DELETE" }).catch((e) => setErr((e as Error).message));
    load();
  }

  const pill = (active: boolean) => `rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${active ? "bg-esp text-white" : "border border-line bg-white text-esp hover:bg-cream"}`;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-esp">Khách hàng</h1>
          <p className="text-[13px] text-muted">Yêu cầu gửi từ website và khách đã tạo tài khoản.</p>
        </div>
        <div className="flex gap-2" role="tablist">
          <button role="tab" aria-selected={tab === "leads"} onClick={() => setTab("leads")} className={pill(tab === "leads")}>
            Yêu cầu ({counts.all})
          </button>
          <button role="tab" aria-selected={tab === "customers"} onClick={() => setTab("customers")} className={pill(tab === "customers")}>
            Tài khoản khách ({customers?.length ?? 0})
          </button>
        </div>
      </div>
      {err && <p className="whitespace-pre-line rounded border border-price/30 bg-price/5 px-4 py-3 text-[13px] text-price">{err}</p>}

      {tab === "leads" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(["all", "new", "contacted", "closed"] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={pill(filter === s)}>
                  {s === "all" ? "Tất cả" : STATUS[s]} ({counts[s]})
                </button>
              ))}
            </div>
            <label className="flex h-10 items-center gap-2 rounded border border-line bg-white px-3 text-[13px]">
              <Icon name="search" size={14} className="text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên, SĐT, mã căn…" aria-label="Tìm khách" className="w-44 bg-transparent focus:outline-none" />
            </label>
          </div>
          {leads && !shown.length ? (
            <Empty>Không có yêu cầu nào.</Empty>
          ) : (
            <div className="overflow-x-auto rounded border border-lineL bg-white">
              <table className="w-full min-w-[860px] text-left text-[13px]">
                <thead className="bg-cream text-[11px] uppercase tracking-[0.06em] text-muted">
                  <tr>
                    {["Thời gian", "Khách", "Liên hệ", "Nguồn", "Ghi chú", "Trạng thái", ""].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((l) => (
                    <tr key={l.id} className="border-t border-lineL align-top hover:bg-page">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{when(l.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {l.name}
                        {l.userId && <span className="ml-1.5 rounded bg-cream px-1.5 py-0.5 text-[10px] font-semibold text-gold">TÀI KHOẢN</span>}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-esp hover:text-gold">
                          {l.phone}
                        </a>
                        {l.email && <div className="text-[12px] text-muted">{l.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {source(l.source)}
                        {l.propertyCode && (
                          <Link href={`/property/${l.propertyCode}`} target="_blank" className="ml-1 font-semibold text-gold">
                            {l.propertyCode}
                          </Link>
                        )}
                      </td>
                      <td className="max-w-[240px] px-4 py-3 text-muted">{l.message}</td>
                      <td className="px-4 py-3">
                        <select value={l.status} onChange={(e) => setStatus(l, e.target.value as Lead["status"])} aria-label={`Trạng thái yêu cầu của ${l.name}`} className={`rounded-full border-0 px-3 py-1 text-[12px] font-semibold ${STATUS_CLS[l.status]}`}>
                          {Object.entries(STATUS).map(([v, t]) => (
                            <option key={v} value={v}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => remove(l)} className="text-[12px] font-semibold text-price">
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : customers && !customers.length ? (
        <Empty>Chưa có khách nào tạo tài khoản.</Empty>
      ) : (
        <div className="overflow-x-auto rounded border border-lineL bg-white">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="bg-cream text-[11px] uppercase tracking-[0.06em] text-muted">
              <tr>
                {["Khách", "Liên hệ", "Căn đã lưu", "Yêu cầu", "Thông báo", "Ngày tạo", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(customers ?? []).map((c) => (
                <tr key={c.id} className="border-t border-lineL align-top hover:bg-page">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{c.fullName || c.username || c.email}</div>
                    {c.username && <div className="text-[12px] text-muted">@{c.username}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {c.phone ? (
                      <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-esp hover:text-gold">
                        {c.phone}
                      </a>
                    ) : (
                      <span className="text-soft">—</span>
                    )}
                    {c.email && <div className="text-[12px] text-muted">{c.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {c.favorites.length ? (
                      <span className="flex flex-wrap gap-1">
                        {c.favorites.map((code) => (
                          <Link key={code} href={`/property/${code}`} target="_blank" className="rounded bg-cream px-2 py-0.5 text-[11px] font-semibold text-esp hover:text-gold">
                            ♡ {code}
                          </Link>
                        ))}
                      </span>
                    ) : (
                      <span className="text-soft">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.requests}</td>
                  <td className="px-4 py-3">{c.alerts}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{when(c.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => promote(c)} className="text-[12px] font-semibold text-gold hover:text-esp">
                      Cấp quyền quản trị
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
