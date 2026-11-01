"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "./AdminShell";
import LeadsManager from "./LeadsManager";
import ResourceManager from "./ResourceManager";
import UsersManager from "./UsersManager";
import { RESOURCES } from "./resources";
import Empty from "../Empty";
import { adminFetch } from "@/lib/adminApi";

function Dashboard() {
  const [stats, setStats] = useState<{ label: string; value: string; href: string; hint?: string }[] | null>(null);
  useEffect(() => {
    const n = (p: string) => adminFetch<unknown[]>(p).catch(() => []);
    Promise.all([n("/admin/properties"), n("/admin/projects"), n("/admin/slides"), n("/admin/leads")]).then(([props, projects, slides, leads]) => {
      const P = props as { published: boolean }[];
      const S = slides as { active: boolean }[];
      const L = leads as { status: string }[];
      setStats([
        { label: "Yêu cầu mới", value: String(L.filter((l) => l.status === "new").length), href: "/admin/leads", hint: `${L.length} yêu cầu tất cả` },
        { label: "Căn đang hiển thị", value: String(P.filter((p) => p.published).length), href: "/admin/properties", hint: `${P.length} căn tất cả` },
        { label: "Dự án", value: String(projects.length), href: "/admin/projects" },
        { label: "Slide đang chạy", value: String(S.filter((s) => s.active).length), href: "/admin/slides" },
      ]);
    });
  }, []);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-esp">Tổng quan</h1>
        <p className="text-[13px] text-muted">Thay đổi hiện trên website sau khoảng 1 phút.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(stats ?? []).map((s) => (
          <Link key={s.label} href={s.href} className="flex flex-col gap-1 rounded-lg border border-lineL bg-white p-5 hover:border-gold">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">{s.label}</span>
            <span className="text-[32px] font-extrabold text-esp">{s.value}</span>
            {s.hint && <span className="text-[12px] text-soft">{s.hint}</span>}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/properties" className="btn-gold">
          + ĐĂNG CĂN MỚI
        </Link>
        <Link href="/admin/slides" className="btn border border-esp text-esp hover:bg-white">
          SỬA SLIDER TRANG CHỦ
        </Link>
      </div>
    </div>
  );
}

/** Client-side admin app: /admin/<section>. AdminShell lets only admins in; the API enforces it too. */
export default function AdminApp({ section }: { section?: string }) {
  return (
    <AdminShell>
      {() => {
        if (!section) return <Dashboard />;
        if (section === "leads") return <LeadsManager />;
        if (section === "users") return <UsersManager />;
        if (RESOURCES[section]) return <ResourceManager key={section} resource={section} />;
        return <Empty>Không tìm thấy mục này.</Empty>;
      }}
    </AdminShell>
  );
}
