"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { adminFetch } from "@/lib/adminApi";

type User = { id: number; username: string | null; email: string | null; role: "admin" | "member"; fullName: string | null; createdAt: string };
const input = "h-10 w-full rounded border border-line bg-white px-3 text-[13px] focus:border-gold focus:outline-none";

/** Tài khoản: admin accounts + create another admin. Customers are listed under Khách hàng. */
export default function UsersManager() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => adminFetch<User[]>("/auth/users").then(setUsers).catch((e) => setMsg({ ok: false, text: e.message })), []);
  useEffect(() => {
    load();
  }, [load]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    try {
      await adminFetch("/auth/users", { method: "POST", body: { username: f.username.trim(), password: f.password, ...(f.email.trim() ? { email: f.email.trim() } : {}) } });
      form.reset();
      setMsg({ ok: true, text: `Đã tạo tài khoản ${f.username}.` });
      load();
    } catch (er) {
      setMsg({ ok: false, text: (er as Error).message });
    }
  }

  const admins = (users ?? []).filter((u) => u.role === "admin");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[24px] font-extrabold text-esp">Tài khoản quản trị</h1>
        <p className="text-[13px] text-muted">Mọi tài khoản quản trị đều có toàn quyền: nội dung, khách hàng và tài khoản.</p>
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
      <form onSubmit={create} className="grid gap-3 rounded border border-lineL bg-white p-5 md:grid-cols-4">
        <h2 className="text-[15px] font-bold text-esp md:col-span-4">Thêm quản trị viên</h2>
        <input name="username" required placeholder="Tên đăng nhập" aria-label="Tên đăng nhập" autoComplete="off" className={input} />
        <input name="password" required type="password" minLength={10} placeholder="Mật khẩu (≥ 10 ký tự)" aria-label="Mật khẩu" autoComplete="new-password" className={input} />
        <input name="email" type="email" placeholder="Email Google/FB (tuỳ chọn)" aria-label="Email" className={input} />
        <button className="btn-dark h-10 justify-center !py-0">TẠO</button>
        {msg && (
          <p role="status" className={`whitespace-pre-line text-[13px] md:col-span-4 ${msg.ok ? "text-verified" : "text-price"}`}>
            {msg.text}
          </p>
        )}
      </form>
    </div>
  );
}
