"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "../Icons";
import { apiFetch, useMe } from "@/lib/auth";
import { SLUG_TYPE } from "@/lib/api";

/** "Nhận thông báo căn mới": saves the listing page's current filters as an email alert. */
export default function AlertButton({ typeSlug, filters }: { typeSlug: string; filters: { district: string; min: string; max: string; beds: string; q: string } }) {
  const me = useMe();
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!me) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    setBusy(true);
    try {
      const n = (v: string) => (v ? Number(v) : undefined);
      await apiFetch("/me/searches", {
        method: "POST",
        body: { type: SLUG_TYPE[typeSlug], district: filters.district || undefined, minPrice: n(filters.min), maxPrice: n(filters.max), minBeds: n(filters.beds), keyword: filters.q || undefined },
      });
      setState({ ok: true, text: me.emailVerified ? `Đã bật. Có căn mới phù hợp, email sẽ gửi tới ${me.email}.` : `Đã bật. Xác minh email ${me.email} (link trong hộp thư) để bắt đầu nhận thông báo.` });
    } catch (e) {
      setState({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={save} disabled={busy} className="flex items-center gap-2 rounded-full border border-gold bg-white px-4 py-2 text-[13px] font-semibold text-esp hover:bg-cream disabled:opacity-60">
        <Icon name="mail" size={15} className="text-gold" /> {busy ? "Đang lưu…" : "Nhận thông báo căn mới với bộ lọc này"}
      </button>
      {state && (
        <span role="status" className={`text-[12px] ${state.ok ? "text-verified" : "text-price"}`}>
          {state.text}{" "}
          {(state.ok || /email/i.test(state.text)) && (
            <Link href="/account#alerts" className="font-semibold text-gold">
              Quản lý
            </Link>
          )}
        </span>
      )}
    </div>
  );
}
