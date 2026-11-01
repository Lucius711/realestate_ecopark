"use client";

import Link from "next/link";
import { Icon } from "./Icons";
import { displayName, isAdmin, useMe } from "@/lib/auth";

/** Nav account entry: "Đăng nhập" → /login; signed in → name → /account (+ "Quản trị" for staff). */
export default function AccountLink({ label }: { label: string }) {
  const me = useMe();
  if (me === undefined) return <span className="inline-block w-6" aria-hidden />; // avoid a flash while checking
  const cls = "flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.08em] text-white hover:text-goldL";
  if (!me)
    return (
      <Link href="/login" className={cls} aria-label={label}>
        <Icon name="user" size={18} /> <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  return (
    <span className="flex items-center gap-3">
      {isAdmin(me) && (
        <Link href="/admin" className="rounded-full bg-gold px-3 py-[5px] text-[11px] font-bold tracking-[0.08em] text-white hover:bg-[#9c7a44]">
          QUẢN TRỊ
        </Link>
      )}
      <Link href="/account" className={cls} aria-label={`Tài khoản: ${displayName(me)}`}>
        <Icon name="user" size={18} /> <span className="hidden max-w-[120px] truncate sm:inline">{displayName(me)}</span>
      </Link>
    </span>
  );
}
