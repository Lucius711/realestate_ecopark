"use client";

import { useRef, useState } from "react";
import { Icon } from "../Icons";
import { uploadFile } from "@/lib/adminApi";

/** One image (or PDF): big "Tải ảnh lên" button + preview; typing a path is tucked away for the rare case it's needed. */
export default function ImageInput({ value, onChange, id, accept = "image/jpeg,image/png,image/webp,image/gif" }: { value: string; onChange: (v: string) => void; id: string; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      onChange(await uploadFile(f));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  const isPdf = accept.includes("pdf");
  const what = isPdf ? "file PDF" : "ảnh";
  const btn = "inline-flex items-center gap-1.5 rounded border px-3 py-2 text-[12px] font-semibold disabled:opacity-50";
  // id sits on the wrapper: a <label for> on a button would replace its "Tải ảnh lên" name with the field label.
  return (
    <div id={id} className="flex flex-col gap-2">
      {value ? (
        <div className="flex flex-wrap items-center gap-3">
          {isPdf ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="flex h-16 items-center gap-2 rounded border border-lineL bg-cream px-4 text-[13px] font-semibold text-esp">
              PDF · Mở xem ↗
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of any path/URL
            <img src={value} alt="Ảnh đã chọn" className="h-24 w-36 rounded border border-lineL bg-cream object-cover" onError={(e) => (e.currentTarget.style.opacity = "0.2")} />
          )}
          <div className="flex flex-col gap-2">
            <button type="button" disabled={busy} onClick={() => ref.current?.click()} className={`${btn} border-esp text-esp hover:bg-cream`}>
              <Icon name="cam" size={14} /> {busy ? "Đang tải…" : `Đổi ${what}`}
            </button>
            <button type="button" onClick={() => onChange("")} className={`${btn} border-transparent text-price hover:bg-price/5`}>
              Xoá {what}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="flex h-24 w-full max-w-[260px] flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-line bg-page text-[13px] font-semibold text-esp hover:border-gold hover:bg-cream disabled:opacity-50">
          <Icon name="cam" size={18} />
          {busy ? "Đang tải…" : `Tải ${what} lên`}
          <span className="text-[11px] font-normal text-muted">{isPdf ? "File .pdf" : "JPG, PNG hoặc WebP"}</span>
        </button>
      )}
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => pick(e.target.files?.[0])} />
      {err && <span className="text-[12px] text-price">{err}</span>}
      <details className="text-[12px] text-muted">
        <summary className="cursor-pointer select-none">Dùng {what} có sẵn trên web</summary>
        <input value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Đường dẫn ${what}`} placeholder={isPdf ? "/brochures/ten-du-an.pdf" : "/images/ten-anh.webp"} className="mt-2 h-9 w-full rounded border border-line bg-white px-3 text-[12px] focus:border-gold focus:outline-none" />
      </details>
    </div>
  );
}
