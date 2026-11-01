"use client";

import { useMe } from "@/lib/auth";
import { useState, type FormEvent } from "react";
import { Icon } from "../Icons";
import { useLead } from "../LeadProvider";

/**
 * "Tải brochure": visitor leaves name + phone (saved as a lead tagged brochure:<slug>), then the PDF downloads.
 * shortcut: the PDF sits in /public, so the form is lead capture, not access control — anyone with the URL can fetch it.
 */
export default function BrochureDownload({ slug, name, file }: { slug: string; name: string; file: string }) {
  const { submit } = useLead();
  const me = useMe(); // signed in → fields pre-filled from the profile
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    await submit({ name: String(f.get("name")).trim(), phone: String(f.get("phone")).trim(), source: `brochure:${slug}` });
    setBusy(false);
    // Download even if saving the lead failed: the visitor did their part.
    const a = document.createElement("a");
    a.href = file;
    a.download = `Brochure-${slug}.pdf`;
    a.click();
    form.reset();
  }

  const input = "h-12 w-full rounded border border-white/40 bg-white/95 px-4 text-[14px] text-ink placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-esp";
  return (
    <section id="brochure" className="gutter grid scroll-mt-24 items-center gap-8 bg-gold py-12 text-white lg:grid-cols-[1fr_560px]">
      <div className="flex items-center gap-5">
        <span className="hidden size-16 shrink-0 items-center justify-center rounded-full bg-white/15 sm:flex">
          <Icon name="doc" size={30} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-[26px] font-bold">Tải brochure {name}</h2>
          <p className="text-[13px] text-white/85">Mặt bằng, loại hình, tiện ích và chính sách bán hàng — nhập tên và số điện thoại để tải ngay (PDF).</p>
        </div>
      </div>
      <form key={me?.id ?? "guest"} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input name="name" defaultValue={me?.fullName ?? ""} required maxLength={80} placeholder="Họ và tên" aria-label="Họ và tên" className={input} />
        <input name="phone" defaultValue={me?.phone ?? ""} required type="tel" pattern="[0-9 +\(\)\.\-]{8,20}" maxLength={20} title="8–20 ký tự: số, khoảng trắng, + ( ) . -" placeholder="Số điện thoại / Zalo" aria-label="Số điện thoại / Zalo" className={input} />
        <button disabled={busy} className="btn-dark h-12 justify-center whitespace-nowrap disabled:opacity-60">
          {busy ? "ĐANG GỬI…" : "TẢI BROCHURE"} <Icon name="arrow" size={14} />
        </button>
      </form>
    </section>
  );
}
