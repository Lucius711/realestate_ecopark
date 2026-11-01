"use client";

import { useState, type InputHTMLAttributes } from "react";
import { inputCls } from "./AuthShell";

/** Password field with a "Hiện / Ẩn" toggle. */
export default function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${inputCls} pr-16`} />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-3 text-[12px] font-semibold text-gold" aria-pressed={show} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
        {show ? "Ẩn" : "Hiện"}
      </button>
    </span>
  );
}
