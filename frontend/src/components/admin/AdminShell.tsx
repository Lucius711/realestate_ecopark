"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon, type IconName } from "../Icons";
import { displayName, isAdmin, token, useMe, type Me } from "@/lib/auth";

// Grouped by what anh Tuấn is doing: selling, dressing the homepage, managing access.
const NAV: { group: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    group: "Bán hàng",
    items: [
      { href: "/admin", label: "Tổng quan", icon: "grid" },
      { href: "/admin/leads", label: "Khách hàng", icon: "user" },
      { href: "/admin/properties", label: "Bất động sản", icon: "tag" },
      { href: "/admin/districts", label: "Phân khu", icon: "pin" },
      { href: "/admin/buildings", label: "Tòa nhà & phí QL", icon: "floor" },
      { href: "/admin/projects", label: "Dự án", icon: "map" },
    ],
  },
  {
    group: "Trang chủ",
    items: [
      { href: "/admin/slides", label: "Slider", icon: "image" },
      { href: "/admin/videos", label: "Video", icon: "play" },
      { href: "/admin/testimonials", label: "Đánh giá khách", icon: "star" },
    ],
  },
  { group: "Hệ thống", items: [{ href: "/admin/users", label: "Tài khoản quản trị", icon: "check" }] },
];

/** Admin chrome: sidebar (tabs on mobile) + top bar. Sends signed-out visitors to /login?next=… */
export default function AdminShell({ children }: { children: (me: Me) => React.ReactNode }) {
  const me = useMe();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (me === null) router.replace(`/login?next=${encodeURIComponent(path)}`);
    else if (me && !isAdmin(me)) router.replace("/account"); // customers have their own area
  }, [me, path, router]);

  if (!me || !isAdmin(me))
    return (
      <div className="flex min-h-screen items-center justify-center bg-page text-[14px] text-muted" role="status">
        Đang kiểm tra đăng nhập…
      </div>
    );

  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-esp text-white lg:sticky lg:top-0 lg:h-screen">
        <Link href="/" className="flex flex-col px-6 pb-4 pt-6">
          <span className="text-[16px] font-extrabold tracking-[0.08em]">NGUYỄN HỒNG TUẤN</span>
          <span className="text-[9px] tracking-[0.3em] text-soft">QUẢN TRỊ WEBSITE</span>
        </Link>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible" aria-label="Quản trị">
          {NAV.map((g) => (
            <div key={g.group} className="flex gap-1 lg:flex-col">
              <p className="hidden px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 lg:block">{g.group}</p>
              {g.items.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active(n.href) ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded px-3 py-2.5 text-[13px] font-medium ${active(n.href) ? "bg-gold text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon name={n.icon} size={16} /> {n.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-lineL bg-white px-4 py-3 md:px-8">
          <Link href="/" target="_blank" className="flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-esp">
            Xem website <Icon name="arrow" size={14} />
          </Link>
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-muted">
              <b className="text-esp">{displayName(me)}</b> · Quản trị viên
            </span>
            <button onClick={() => token.set(null)} className="rounded border border-line px-3 py-1.5 font-semibold text-esp hover:bg-cream">
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children(me)}</main>
      </div>
    </div>
  );
}
