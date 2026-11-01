"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";

type User = { id: number; username: string | null; email: string | null; role: "admin" | "member"; fullName: string | null; createdAt: string };

/** Tài khoản: who can open the admin. New admins come from "Cấp quyền quản trị" under Khách hàng → Tài khoản khách. */
export default function UsersManager() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => adminFetch<User[]>("/auth/users").then(setUsers).catch((e) => setMsg({ ok: false, text: e.message })), []);
  useEffect(() => {
    load();
  }, [load]);

  const admins = (users ?? []).filter((u) => u.role === "admin");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-esp">Tài khoản quản trị</h1>
        <p className="text-[13px] text-muted">Muốn thêm quản trị viên: người đó đăng ký hoặc đăng nhập Google một lần, rồi vào Khách hàng → Tài khoản khách và bấm “Cấp quyền quản trị”.</p>
      </div>
      <div className="overflow-x-auto rounded border border-lineL bg-white">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="bg-cream text-[11px] uppercase tracking-[0.06em] text-muted">
            <tr>
              {["Tên đăng nhập", "Email (Google/Facebook)", "Ngày tạo"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map((u) => (
              <tr key={u.id} className="border-t border-lineL">
                <td className="px-4 py-3 font-semibold text-ink">{u.username ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {msg && (
        <p role="status" className="text-[13px] text-price">
          {msg.text}
        </p>
      )}
    </div>
  );
}
