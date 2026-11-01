"use client";

import { useState } from "react";
import { Icon } from "../Icons";
import { LinkPicker, RefSelect, RepeatEditor } from "./editors";
import ImageInput from "./ImageInput";
import type { Field, Option, Tone } from "./resources";
import { uploadFile } from "@/lib/adminApi";

export const input = "h-10 w-full rounded border border-line bg-white px-3 text-[13px] placeholder:text-soft focus:border-gold focus:outline-none";

/** Colour per meaning; always paired with text so colour is never the only signal. */
export const TONE: Record<Tone, { pill: string; dot: string; card: string }> = {
  green: { pill: "bg-[#E8F3EC] text-verified", dot: "bg-verified", card: "border-verified bg-[#F3FAF5]" },
  amber: { pill: "bg-[#FBF0DC] text-[#8A5A0B]", dot: "bg-[#C98A1B]", card: "border-[#C98A1B] bg-[#FDF8EE]" },
  dark: { pill: "bg-esp text-white", dot: "bg-esp", card: "border-esp bg-cream" },
  gray: { pill: "bg-page text-muted", dot: "bg-soft", card: "border-line bg-page" },
};

export function StatusPill({ option }: { option?: Option }) {
  if (!option) return null;
  const t = TONE[option.tone ?? "gray"];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${t.pill}`}>
      <span className={`size-1.5 rounded-full ${t.dot}`} aria-hidden /> {option.label}
    </span>
  );
}

/** Big, explained choices (e.g. listing status): the user sees what each option does before picking it. */
function RadioCards({ f, value, set }: { f: Field; value: string; set: (v: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{f.label}</legend>
      {f.options!.map((o) => {
        const on = value === o.value;
        return (
          <label key={o.value} className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-colors ${on ? TONE[o.tone ?? "gray"].card : "border-lineL bg-white hover:border-line"}`}>
            <input type="radio" name={f.name} value={o.value} checked={on} onChange={() => set(o.value)} className="mt-0.5 size-4 accent-gold" />
            <span className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold text-esp">{o.label}</span>
              {o.hint && <span className="text-[12px] leading-relaxed text-muted">{o.hint}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function Toggle({ f, checked, set, note }: { f: Field; checked: boolean; set: (v: boolean) => void; note?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-lineL bg-white px-4 py-3 hover:border-line">
      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="mt-0.5 size-4 accent-gold" />
      <span className="flex flex-col gap-0.5">
        <span className="text-[14px] font-semibold text-esp">{f.label}</span>
        {(note || f.hint) && <span className="text-[12px] leading-relaxed text-muted">{note ?? f.hint}</span>}
      </span>
    </label>
  );
}

export function FieldInput({ f, value, set }: { f: Field; value: string | boolean; set: (v: string | boolean) => void }) {
  const id = `f-${f.name}`;
  if (f.type === "checkbox") return <Toggle f={f} checked={Boolean(value)} set={set} />;
  if (f.type === "stamp") {
    const on = Boolean(value);
    // Keep the original date when re-saving; a fresh tick records today.
    return <Toggle f={f} checked={on} set={(c) => set(c ? new Date().toISOString() : "")} note={on ? `Đã tích ngày ${new Date(String(value)).toLocaleDateString("vi-VN")}. ${f.hint ?? ""}` : f.hint} />;
  }
  if (f.type === "radio") return <RadioCards f={f} value={String(value)} set={set} />;
  let control: React.ReactNode;
  if (f.type === "select")
    control = (
      <select id={id} value={String(value)} onChange={(e) => set(e.target.value)} className={input}>
        {f.options!.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  else if (f.type === "textarea") control = <textarea id={id} value={String(value)} onChange={(e) => set(e.target.value)} rows={5} placeholder={f.placeholder} className={`${input} h-auto py-2 leading-relaxed`} />;
  else if (f.type === "repeat") control = <RepeatEditor f={f} id={id} value={String(value)} set={set} />;
  else if (f.type === "ref") control = <RefSelect f={f} id={id} value={String(value)} set={set} />;
  else if (f.type === "link") control = <LinkPicker id={id} value={String(value)} set={set} />;
  else if (f.type === "image") control = <ImageInput id={id} value={String(value)} onChange={set} accept={f.accept} />;
  else if (f.type === "list") control = <ImageList id={id} value={String(value)} onChange={set} />;
  else control = <input id={id} type="text" inputMode={f.type === "number" ? "decimal" : undefined} value={String(value)} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} className={input} />;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-esp">
        {f.label} {f.required ? <span className="text-price" aria-label="bắt buộc">*</span> : <span className="font-normal text-soft">(không bắt buộc)</span>}
      </label>
      {control}
      {f.hint && <span className="text-[12px] text-muted">{f.hint}</span>}
    </div>
  );
}

/** Several images, one path per line, with thumbnails and an upload button that appends. */
export function ImageList({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const list = value.split("\n").map((s) => s.trim()).filter(Boolean);
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadFile(f));
      onChange([...list, ...urls].join("\n"));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const move = (i: number, d: number) => {
    const l = [...list];
    [l[i], l[i + d]] = [l[i + d], l[i]];
    onChange(l.join("\n"));
  };
  return (
    <div className="flex flex-col gap-2">
      {list.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {list.map((src, i) => (
            <li key={src + i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
              <img src={src} alt="" className={`h-20 w-28 rounded border object-cover ${i === 0 ? "border-gold ring-2 ring-gold/40" : "border-lineL"}`} />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] text-white">{i === 0 ? "Bìa" : i + 1}</span>
              <span className="absolute bottom-1 right-1 flex gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => move(i, -1)} aria-label="Đưa lên trước" className="rounded bg-white/90 px-1 text-[11px]">
                    ←
                  </button>
                )}
                <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i).join("\n"))} aria-label="Xoá ảnh" className="rounded bg-white/90 px-1 text-[11px] text-price">
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <label className={`inline-flex w-fit cursor-pointer items-center gap-1.5 rounded border border-esp px-3 py-2 text-[12px] font-semibold text-esp hover:bg-cream ${busy ? "pointer-events-none opacity-50" : ""}`}>
        <Icon name="cam" size={14} /> {busy ? "Đang tải…" : "Tải ảnh lên (chọn được nhiều)"}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => add(e.target.files)} />
      </label>
      {err && <span className="text-[12px] text-price">{err}</span>}
      <details className="text-[12px] text-muted">
        <summary className="cursor-pointer select-none">Dùng ảnh có sẵn trên web (mỗi dòng một đường dẫn)</summary>
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${input} mt-2 h-auto py-2 font-mono text-[12px]`} />
      </details>
    </div>
  );
}
