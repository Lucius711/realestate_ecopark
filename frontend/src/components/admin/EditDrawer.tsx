"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { Icon } from "../Icons";
import { FieldInput, StatusPill } from "./fields";
import type { Values } from "./form";
import type { Field, Lookups } from "./resources";

/** Status shown as a coloured pill that is also a select: change "Đang bán → Đã cọc" without opening the form. */
export function StatusSelect({ field, value, label, onChange }: { field: Field; value: string; label: string; onChange: (v: string) => void }) {
  const opt = field.options!.find((o) => o.value === value);
  return (
    <span className="relative inline-flex">
      <StatusPill option={opt} />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="absolute inset-0 cursor-pointer opacity-0">
        {field.options!.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

export function EditDrawer({
  title,
  fields,
  values,
  lookups,
  set,
  onSubmit,
  onClose,
  saving,
  error,
  dirty,
}: {
  title: string;
  fields: Field[];
  values: Values;
  lookups: Lookups;
  set: (name: string, v: string | boolean) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  saving: boolean;
  error: string;
  dirty: boolean;
}) {
  const panel = useRef<HTMLFormElement>(null);
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea")?.focus();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fields grouped by their section, in first-seen order.
  const sections: [string, Field[]][] = [];
  for (const f of fields) {
    const name = f.section ?? "";
    const s = sections.find(([n]) => n === name);
    if (s) s[1].push(f);
    else sections.push([name, [f]]);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <form ref={panel} onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[680px] animate-fadeIn flex-col bg-page shadow-xl">
        <div className="flex items-center justify-between border-b border-lineL bg-white px-6 py-4">
          <h2 className="text-[18px] font-bold text-esp">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded p-1 hover:bg-cream">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {sections.map(([name, fs]) => (
            <section key={name || "main"} className="flex flex-col gap-4 rounded-lg border border-lineL bg-white p-5">
              {name && <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-gold">{name}</h3>}
              <div className="grid gap-4 sm:grid-cols-2">
                {fs.map((f) => (
                  <div key={f.name} className={["number", "select", "ref"].includes(f.type) ? "" : "sm:col-span-2"}>
                    <FieldInput
                      f={f}
                      value={values[f.name] ?? ""}
                      set={(v) => set(f.name, v)}
                      fill={f.template && (() => (!values[f.name] || window.confirm("Thay mô tả hiện tại bằng mô tả tự tạo?")) && set(f.name, f.template!(values, lookups)))}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-lineL bg-white px-6 py-4">
          {error && (
            <p role="alert" className="whitespace-pre-line rounded border border-price/30 bg-price/5 px-3 py-2 text-[13px] text-price">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] text-muted">{dirty ? "● Có thay đổi chưa lưu" : "Chưa có thay đổi"}</span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded border border-line px-5 py-2.5 text-[13px] font-semibold text-esp hover:bg-cream">
                Huỷ
              </button>
              <button disabled={saving} className="btn-dark min-w-[120px] justify-center disabled:opacity-60">
                {saving ? "ĐANG LƯU…" : "LƯU"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
