"use client";

import { useMe } from "@/lib/auth";
import { useState, type FormEvent } from "react";
import { useLead } from "../LeadProvider";

/** Figma: agent card "Đặt lịch xem nhà" form. Posts a lead tagged with the property code. */
export default function BookingForm({ propertyCode, source = "detail", cta = "ĐẶT LỊCH" }: { propertyCode?: string; source?: string; cta?: string }) {
  const { submit } = useLead();
  const me = useMe(); // signed in → fields pre-filled from the profile
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    const ok = await submit({
      name: String(f.get("name")).trim(),
      phone: String(f.get("phone")).trim(),
      message: f.get("date") ? `Ngày muốn xem: ${f.get("date")}` : undefined,
      source,
      propertyCode,
    });
    setBusy(false);
    if (ok) form.reset();
  }

  const input = "h-11 w-full rounded border border-line bg-white px-3.5 text-[14px] text-ink placeholder:text-soft focus:border-gold focus:outline-none";
  return (
    <form key={me?.id ?? "guest"} onSubmit={onSubmit} className="flex flex-col gap-2.5">
      <input name="name" defaultValue={me?.fullName ?? ""} required maxLength={80} placeholder="Họ và tên" aria-label="Họ và tên" className={input} />
      <input name="phone" defaultValue={me?.phone ?? ""} required type="tel" pattern="[0-9 +\(\)\.\-]{8,20}" maxLength={20} title="8–20 ký tự: số, khoảng trắng, + ( ) . -" placeholder="Số điện thoại / Zalo" aria-label="Số điện thoại / Zalo" className={input} />
      <input name="date" type="date" aria-label="Ngày muốn xem" className={input} />
      <button disabled={busy} className="btn-dark justify-center disabled:opacity-60">
        {busy ? "ĐANG GỬI…" : cta}
      </button>
    </form>
  );
}
