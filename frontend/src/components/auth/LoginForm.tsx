"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "../Icons";
import { SocialButtons, inputCls, labelCls } from "./AuthShell";
import PasswordInput from "./PasswordInput";
import { authRequest, displayName, homeFor, isAdmin, token, useMe } from "@/lib/auth";

// Only same-site paths, so ?next= can't bounce people to another domain. null = go to the user's home.
export const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null);

/** /login for everyone: customers land on /account, staff on /admin (unless ?next= says otherwise). */
export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const justRegistered = params.get("registered") === "1"; // set by /register
  const me = useMe();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fromOAuth, setFromOAuth] = useState(false);

  useEffect(() => {
    // Back from Google/Facebook: the API puts #token=… or #error=… in the URL fragment.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (!hash.has("token") && !hash.has("error")) return;
    history.replaceState(null, "", window.location.pathname + window.location.search);
    if (hash.get("error")) setError(hash.get("error")!);
    if (hash.get("token")) {
      setFromOAuth(true);
      token.set(hash.get("token"));
    }
  }, []);

  // After Google/Facebook we only learn the role once /auth/me answers.
  useEffect(() => {
    if (fromOAuth && me) router.replace(next ?? homeFor(me));
  }, [fromOAuth, me, next, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const user = await authRequest("login", { username: String(f.get("username")).trim(), password: String(f.get("password")) });
      router.replace(next ?? homeFor(user));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (me && !fromOAuth && !busy)
    return (
      <div className="flex flex-col gap-5">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#E8F3EC] text-verified">
          <Icon name="check" size={26} />
        </div>
        <div>
          <h1 className="text-[28px] font-extrabold text-esp">Xin chào!</h1>
          <p className="mt-1 text-[14px] text-muted">
            Bạn đang đăng nhập: <b className="text-esp">{displayName(me)}</b>
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={homeFor(me)} className="btn-dark flex-1 justify-center">
            {isAdmin(me) ? "VÀO TRANG QUẢN TRỊ" : "TÀI KHOẢN CỦA TÔI"}
          </Link>
          <button onClick={() => token.set(null)} className="btn flex-1 justify-center border border-esp text-esp hover:bg-cream">
            ĐĂNG XUẤT
          </button>
        </div>
      </div>
    );

  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-extrabold leading-tight text-esp">Đăng nhập</h1>
        <p className="text-[14px] text-muted">Lưu căn yêu thích, theo dõi yêu cầu và nhận thông báo căn mới tại Ecopark.</p>
      </div>

      {justRegistered && !error && (
        <p role="status" className="rounded border border-verified/30 bg-[#E8F3EC] px-4 py-3 text-[13px] text-verified">
          ✓ Đăng ký thành công. Vui lòng đăng nhập bằng tài khoản vừa tạo.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded border border-price/30 bg-price/5 px-4 py-3 text-[13px] text-price">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className={labelCls}>
          Tên đăng nhập
          <input name="username" required maxLength={64} defaultValue={params.get("username") ?? ""} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="vd: minhanh" className={inputCls} />
        </label>
        <label className={labelCls}>
          Mật khẩu
          <PasswordInput name="password" required maxLength={200} autoComplete="current-password" placeholder="••••••••" autoFocus={justRegistered} />
        </label>
        <button disabled={busy} className="btn-dark h-12 justify-center disabled:opacity-60">
          {busy ? "ĐANG ĐĂNG NHẬP…" : "ĐĂNG NHẬP"}
        </button>
      </form>

      <SocialButtons />

      <p className="text-center text-[13px] text-muted">
        Chưa có tài khoản?{" "}
        <Link href={`/register${q}`} className="font-semibold text-gold hover:text-esp">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
