"use client";

import { useMe } from "@/lib/auth";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icon } from "./Icons";
import { useLead } from "./LeadProvider";
import { dict, type Lang } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";

/** Figma: "Footer" – contact form (left) + brand/links (right) + copyright bar. */
export default function Footer({ lang = "vi" }: { lang?: Lang }) {
  const t = dict[lang].footer;
  const { submit } = useLead();
  const me = useMe(); // signed in → fields pre-filled from the profile
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    const ok = await submit({
      name: String(f.get("name")),
      email: String(f.get("email") || "") || undefined,
      phone: String(f.get("phone")),
      message: String(f.get("message") || "") || undefined,
      source: "footer",
    });
    setBusy(false);
    if (ok) form.reset();
  }

  const field = "w-full border-b border-white/30 bg-transparent pb-2.5 pt-1 text-[14px] text-white placeholder:text-soft focus:border-goldL focus:outline-none";
  const links = [
    { label: t.links[0], href: "#contact" },
    { label: t.links[1], href: "#contact" },
    { label: t.links[2], href: "/properties/for-rent" },
    { label: t.links[3], href: "/properties/for-rent" },
  ];

  return (
    <footer id="contact" className="scroll-mt-24 bg-esp">
      <div className="gutter grid gap-14 pb-[60px] pt-20 lg:grid-cols-[560px_1fr] lg:gap-[100px]">
        <form key={me?.id ?? "guest"} onSubmit={onSubmit} className="flex flex-col gap-[22px]" aria-labelledby="footer-title">
          <h2 id="footer-title" className="text-[28px] font-extrabold text-white">
            {t.title}
          </h2>
          <input name="name" defaultValue={me?.fullName ?? ""} required maxLength={80} aria-label={t.name} placeholder={t.name} className={field} />
          <input name="email" defaultValue={me?.email ?? ""} type="email" maxLength={120} aria-label={t.email} placeholder={t.email} className={field} />
          <input name="phone" defaultValue={me?.phone ?? ""} required inputMode="tel" pattern="[0-9 +\(\)\.\-]{8,20}" maxLength={20} title="8–20 ký tự: số, khoảng trắng, + ( ) . -" aria-label={t.phone} placeholder={t.phone} className={field} />
          <input name="message" maxLength={1000} aria-label={t.message} placeholder={t.message} className={field} />
          <label className="flex items-start gap-3 text-[12px] leading-[1.6] text-soft">
            <input type="checkbox" required className="mt-0.5 size-4 accent-gold" />
            {t.consent}
          </label>
          <button disabled={busy} className="btn-gold self-start disabled:opacity-60">
            {busy ? "…" : t.send}
          </button>
        </form>

        <div className="flex flex-col gap-9">
          <div className="flex flex-col gap-0.5">
            <p className="text-[26px] tracking-[0.08em] text-white">
              <span className="font-light">NGUYỄN</span>
              <span className="font-bold text-goldL">TUẤN</span>
            </p>
            <p className="whitespace-pre text-[10px] font-medium tracking-[0.3em] text-soft">{"ECOPARK  REAL  ESTATE"}</p>
          </div>
          <p className="text-[13px] leading-[1.8] text-[#D8CDBE]">
            {t.address}
            <br />
            <a href={`tel:${CONTACT.phoneTel}`} className="hover:text-white">
              {CONTACT.phone}
            </a>
            {"  ·  "}
            <a href={`mailto:${CONTACT.email}`} className="hover:text-white">
              {CONTACT.email}
            </a>
          </p>
          <ul className="grid max-w-[488px] gap-x-12 gap-y-[18px] sm:grid-cols-2">
            {links.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="flex items-center gap-2.5 text-[13px] font-bold tracking-[0.08em] text-white hover:text-goldL">
                  <Icon name="chevR" size={16} className="text-goldL" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-espDeep px-4 py-6 text-center text-[11px] text-[#8F8576]">{t.copyright}</div>
    </footer>
  );
}
