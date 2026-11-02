"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SocialButtons, inputCls, labelCls } from "./AuthShell";
import PasswordInput from "./PasswordInput";
import { safeNext } from "./LoginForm";
import { apiFetch } from "@/lib/auth";

type F = { fullName: string; username: string; phone: string; email: string; password: string; confirm: string };

// Same rules as the API's RegisterDto, checked here first so mistakes show next to the field.
function validate(f: F) {
  const e: Partial<Record<keyof F, string>> = {};
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(f.username)) e.username = "3–32 ký tự, chỉ gồm chữ không dấu, số và . _ -";
  if (f.phone && !/^(?=(?:\D*\d){8,15}\D*$)[0-9 +().-]{8,20}$/.test(f.phone)) e.phone = "Số điện thoại không hợp lệ";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Email không hợp lệ";
  if (f.password.length < 8) e.password = "Mật khẩu tối thiểu 8 ký tự";
  if (f.confirm !== f.password) e.confirm = "Mật khẩu nhập lại không khớp";
  return e;
}

/** /register: creates a customer (member) account, then sends them to /login to sign in with it (keeps ?next=). */
export default function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errs, setErrs] = useState<Partial<Record<keyof F, string>>>({});

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const f = Object.fromEntries(["fullName", "username", "phone", "email", "password", "confirm"].map((k) => [k, String(fd.get(k) ?? "").trim()])) as F;
    f.password = String(fd.get("password"));
    f.confirm = String(fd.get("confirm"));
    const v = validate(f);
    setErrs(v);
    setError("");
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const body = Object.fromEntries(Object.entries(f).filter(([k, x]) => k !== "confirm" && x)); // empty optional fields left out
      await apiFetch("/auth/register", { method: "POST", body }); // the returned token is ignored on purpose: sign in next
      const q = new URLSearchParams({ registered: "1", username: f.username, ...(next ? { next } : {}) });
      router.replace(`/login?${q}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const field = (name: keyof F) => ({ name, "aria-invalid": !!errs[name], "aria-describedby": errs[name] ? `${name}-err` : undefined });
  const hint = (name: keyof F) =>
    errs[name] && (
      <span id={`${name}-err`} className="text-[12px] font-normal text-price">
        {errs[name]}
      </span>
    );
  const optional = <span className="font-normal text-soft">(không bắt buộc)</span>;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-extrabold leading-tight text-esp">Tạo tài khoản</h1>
        <p className="text-[14px] text-muted">Lưu căn yêu thích, theo dõi lịch xem nhà và nhận email khi có căn mới đúng nhu cầu.</p>
      </div>

      {error && (
        <p role="alert" className="whitespace-pre-line rounded border border-price/30 bg-price/5 px-4 py-3 text-[13px] text-price">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <label className={labelCls}>
          <span>Họ và tên {optional}</span>
          <input maxLength={80} autoComplete="name" placeholder="vd: Nguyễn Minh Anh" className={inputCls} {...field("fullName")} />
        </label>
        <label className={labelCls}>
          Tên đăng nhập
          <input maxLength={32} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="vd: minhanh" className={inputCls} {...field("username")} />
          {hint("username")}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>
            <span>Số điện thoại {optional}</span>
            <input type="tel" maxLength={20} autoComplete="tel" placeholder="09xx xxx xxx" className={inputCls} {...field("phone")} />
            {hint("phone")}
          </label>
          <label className={labelCls}>
            <span>Email {optional}</span>
            <input type="email" maxLength={120} autoComplete="email" placeholder="ban@email.com" className={inputCls} {...field("email")} />
            {hint("email")}
          </label>
        </div>
        <p className="-mt-2 text-[12px] text-soft">Cần email để nhận thông báo căn mới. Số điện thoại giúp điền sẵn khi đặt lịch xem nhà.</p>
        <label className={labelCls}>
          Mật khẩu
          <PasswordInput maxLength={200} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" {...field("password")} />
          {hint("password")}
        </label>
        <label className={labelCls}>
          Nhập lại mật khẩu
          <PasswordInput maxLength={200} autoComplete="new-password" placeholder="••••••••" {...field("confirm")} />
          {hint("confirm")}
        </label>
        <button disabled={busy} className="btn-dark h-12 justify-center disabled:opacity-60">
          {busy ? "ĐANG TẠO TÀI KHOẢN…" : "ĐĂNG KÝ"}
        </button>
      </form>

      <SocialButtons verb="Đăng ký" />

      <p className="text-center text-[13px] text-muted">
        Đã có tài khoản?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-gold hover:text-esp">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
