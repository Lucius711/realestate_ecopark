"use client";

import Image from "next/image";
import Link from "next/link";
import AccountLink from "./AccountLink";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";
import { dict, type Lang } from "@/lib/i18n";

/** Figma: "Nav" + component "Nav / Dropdown Bất động sản" (mega menu). */
export default function Nav({
  lang = "vi",
  counts,
}: {
  lang?: Lang;
  counts?: Record<string, number>;
}) {
  const t = dict[lang].nav;
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrap = useRef<HTMLDivElement>(null);

  // Hover opens; leaving the trigger+panel closes after a short delay so the pointer can travel into the panel.
  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && (setOpen(false), setMobile(false));
    const onClick = (e: MouseEvent) =>
      wrap.current &&
      !wrap.current.contains(e.target as Node) &&
      setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  const home = lang === "en" ? "/en" : "/";
  const links = [
    { href: "/about", label: t.about },
    { href: "/ecopark", label: t.ecopark },
    { href: "#contact", label: t.contact },
  ];

  return (
    <header className="sticky top-0 z-50 bg-esp">
      <div className="flex items-center justify-between px-4 py-[22px] md:px-10 xl:px-16">
        <Link
          href={home}
          className="flex flex-col gap-0.5"
          aria-label="Nguyễn Hồng Tuấn – trang chủ"
        >
          <span className="text-[18px] font-extrabold leading-[35px] tracking-[0.08em] text-white md:text-[22px]">
            NGUYỄN HỒNG TUẤN
          </span>
          <span className="whitespace-pre text-[9px] font-medium tracking-[0.3em] text-soft">
            {"ECOPARK  REAL  ESTATE"}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-[18px] lg:flex"
          aria-label="Chính"
        >
          <div
            ref={wrap}
            className="relative"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <button
              className={`flex items-center gap-1.5 py-1.5 text-[12px] font-semibold tracking-[0.08em] ${open ? "text-goldL" : "text-white"}`}
              aria-expanded={open}
              aria-haspopup="true"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => !o);
              }}
            >
              {t.properties}
              <Icon
                name={open ? "chevU" : "chevD"}
                size={12}
                strokeWidth={2.2}
              />
            </button>
            {open && (
              // pt-3 is the invisible "hover bridge" between trigger and panel
              <div className="absolute -left-10 top-full pt-3">
                <div className="flex gap-5 rounded-b-lg border-t-2 border-gold bg-[#2F2722] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                  {t.cats.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/properties/${c.slug}`}
                      className="group flex w-[210px] flex-col gap-2.5"
                      onClick={() => setOpen(false)}
                    >
                      <span className="relative h-[124px] w-[210px] overflow-hidden rounded">
                        <Image
                          src={c.img}
                          alt=""
                          fill
                          sizes="210px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </span>
                      <span className="text-[16px] font-semibold text-white">
                        {c.title}
                      </span>
                      <span className="text-[12px] leading-[1.5] text-soft">
                        {c.desc}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-bold tracking-[0.04em] text-goldL">
                        {t.available(counts?.[c.slug] ?? 6)}{" "}
                        <Icon name="arrow" size={14} strokeWidth={2} />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {links.map((l) => (
            <span key={l.href} className="flex items-center gap-[18px]">
              <span className="text-[12px] text-[#6b6058]" aria-hidden>
                |
              </span>
              <Link
                href={l.href}
                className="text-[12px] font-semibold tracking-[0.08em] text-white hover:text-goldL"
              >
                {l.label}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <AccountLink label={t.login} />
          <div className="flex items-center gap-1.5 rounded-full border border-white/30 px-2.5 py-[5px] text-[12px] tracking-[0.08em]">
            {lang === "vi" ? (
              <span className="font-bold text-goldL">VI</span>
            ) : (
              <Link
                href="/"
                className="font-medium text-white/60 hover:text-white"
              >
                VI
              </Link>
            )}
            <span className="font-medium text-white/60">|</span>
            {lang === "en" ? (
              <span className="font-bold text-goldL">EN</span>
            ) : (
              <Link
                href="/en"
                className="font-medium text-white/60 hover:text-white"
              >
                EN
              </Link>
            )}
          </div>
          <button
            className="text-white"
            aria-label="Mở menu"
            aria-expanded={mobile}
            onClick={() => setMobile((m) => !m)}
          >
            <Icon name={mobile ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {mobile && (
        <nav
          className="border-t border-white/10 bg-esp px-4 pb-6 md:px-10"
          aria-label="Menu"
        >
          <p className="pt-4 text-[11px] font-bold tracking-[0.16em] text-goldL">
            {t.properties}
          </p>
          {t.cats.map((c) => (
            <Link
              key={c.slug}
              href={`/properties/${c.slug}`}
              className="block py-2.5 text-[15px] text-white"
              onClick={() => setMobile(false)}
            >
              {c.title}
            </Link>
          ))}
          <Link
            href="/account"
            className="block border-t border-white/10 py-3 text-[13px] font-semibold tracking-[0.08em] text-goldL"
            onClick={() => setMobile(false)}
          >
            {t.account}
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block border-t border-white/10 py-3 text-[13px] font-semibold tracking-[0.08em] text-white"
              onClick={() => setMobile(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
