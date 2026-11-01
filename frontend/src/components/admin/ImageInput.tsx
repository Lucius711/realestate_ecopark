"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@/lib/adminApi";

/** Image path/URL field with "Tải ảnh lên" (uploads to the API → Supabase Storage or local disk) and a preview. */
export default function ImageInput({ value, onChange, id, accept = "image/jpeg,image/png,image/webp,image/gif", invalid }: { value: string; onChange: (v: string) => void; id: string; accept?: string; invalid?: boolean }) {
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
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={isPdf ? "/brochures/ten-du-an.pdf" : "/images/ten-anh.webp"} aria-invalid={invalid} className="h-10 min-w-0 flex-1 rounded border border-line bg-white px-3 text-[13px] focus:border-gold focus:outline-none aria-[invalid=true]:border-price" />
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="shrink-0 rounded border border-esp px-3 text-[12px] font-semibold text-esp hover:bg-cream disabled:opacity-50">
          {busy ? "Đang tải…" : isPdf ? "Tải PDF lên" : "Tải ảnh lên"}
        </button>
        <input ref={ref} type="file" accept={accept} hidden onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      {err && <span className="text-[12px] text-price">{err}</span>}
      {value && !isPdf && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of any path/URL, no need for next/image here
        <img src={value} alt="Xem trước" className="h-24 w-36 rounded border border-lineL bg-cream object-cover" onError={(e) => (e.currentTarget.style.opacity = "0.2")} />
      )}
      {value && isPdf && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-gold">
          Mở file PDF ↗
        </a>
      )}
    </div>
  );
}
