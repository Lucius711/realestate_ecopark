"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "../Icons";
import Empty from "../Empty";
import ImageInput from "./ImageInput";
import { RESOURCES, type Field } from "./resources";
import { adminFetch, uploadFile } from "@/lib/adminApi";

type Row = Record<string, unknown>;
type Values = Record<string, string | boolean>;

// Record → form strings (lists one per line, JSON pretty-printed).
function toValues(fields: Field[], row: Row): Values {
  const v: Values = {};
  for (const f of fields) {
    const x = row[f.name];
    if (f.type === "checkbox") v[f.name] = Boolean(x);
    else if (f.type === "list") v[f.name] = Array.isArray(x) ? x.join("\n") : "";
    else if (f.type === "json") v[f.name] = JSON.stringify(x ?? [], null, 2);
    else v[f.name] = x == null ? "" : String(x);
  }
  return v;
}

// Form strings → API payload. Throws a readable message for bad JSON / numbers.
function toPayload(fields: Field[], v: Values, skip?: string): Row {
  const out: Row = {};
  const missing: string[] = [];
  for (const f of fields) {
    if (f.name === skip) continue;
    const raw = v[f.name];
    if (f.type === "checkbox") out[f.name] = Boolean(raw);
    else if (f.type === "list") {
      out[f.name] = String(raw).split("\n").map((s) => s.trim()).filter(Boolean);
      if (f.required && !(out[f.name] as string[]).length) missing.push(f.label);
    }
    else if (f.type === "json") {
      try {
        out[f.name] = JSON.parse(String(raw) || "[]");
      } catch {
        throw new Error(`"${f.label}" không phải JSON hợp lệ`);
      }
    } else {
      const s = String(raw).trim();
      if (s === "") {
        if (f.nullable) out[f.name] = null;
        else if (!f.required && f.type !== "number") out[f.name] = "";
        else if (f.required) missing.push(f.label);
        continue;
      }
      if (f.type === "number" || f.numeric) {
        const n = Number(s.replace(",", "."));
        if (Number.isNaN(n)) throw new Error(`"${f.label}" phải là số`);
        out[f.name] = n;
      } else out[f.name] = s;
    }
  }
  // One clear line per empty required field, instead of the API's "must be a number / ≥ 0 / ≤ max" trio.
  if (missing.length) throw new Error(missing.map((l) => `${l}: bắt buộc`).join("\n"));
  return out;
}


// API (class-validator) messages are English and use field names; show them in Vietnamese with the form's labels.
const PHRASES: [RegExp, string][] = [
  [/must not be less than (\S+)/, "không được nhỏ hơn $1"],
  [/must not be greater than (\S+)/, "không được lớn hơn $1"],
  [/must be longer than or equal to (\d+) characters/, "phải có ít nhất $1 ký tự"],
  [/must be shorter than or equal to (\d+) characters/, "tối đa $1 ký tự"],
  [/must be a number conforming to the specified constraints/, "phải là số"],
  [/must be an integer number/, "phải là số nguyên"],
  [/must be one of the following values: (.+)/, "phải là một trong: $1"],
  [/must be a boolean value/, "phải là Có/Không"],
  [/must be a string/, "phải là chữ"],
  [/must be an array/, "phải là danh sách"],
  [/must contain at least (\d+) elements/, "cần ít nhất $1 mục"],
  [/must contain no more than (\d+) elements/, "tối đa $1 mục"],
  [/must be a valid ISO 8601 date string/, "phải là ngày hợp lệ"],
  [/must match .+ regular expression/, "sai định dạng"],
  [/^property (\S+) should not exist$/, "$1: trường không hợp lệ"],
];
function viMessage(msg: string, fields: Field[]) {
  return msg
    .split("\n")
    .map((line) => {
      let out = line;
      for (const [re, vi] of PHRASES) out = out.replace(re, vi);
      const f = fields.find((x) => out.startsWith(x.name + " ") || out.startsWith(x.name + ".") || out.startsWith(x.name + ":"));
      return f ? `${f.label}${out.slice(f.name.length).replace(/^\./, " › ")}` : out;
    })
    .join("\n");
}

const input = "h-10 w-full rounded border border-line bg-white px-3 text-[13px] focus:border-gold focus:outline-none";

function FieldInput({ f, value, set }: { f: Field; value: string | boolean; set: (v: string | boolean) => void }) {
  const id = `f-${f.name}`;
  if (f.type === "checkbox")
    return (
      <label className="flex items-center gap-2.5 text-[13px] font-medium text-esp">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} className="size-4 accent-gold" /> {f.label}
      </label>
    );
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
  else if (f.type === "textarea" || f.type === "json")
    control = <textarea id={id} value={String(value)} onChange={(e) => set(e.target.value)} rows={f.type === "json" ? 8 : 4} className={`${input} h-auto py-2 ${f.type === "json" ? "font-mono text-[12px]" : ""}`} />;
  else if (f.type === "image") control = <ImageInput id={id} value={String(value)} onChange={set} accept={f.accept} />;
  else if (f.type === "list") control = <ImageList id={id} value={String(value)} onChange={set} />;
  else control = <input id={id} type="text" inputMode={f.type === "number" ? "decimal" : undefined} value={String(value)} onChange={(e) => set(e.target.value)} className={input} />;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold text-esp">
        {f.label} {f.required && <span className="text-price">*</span>}
      </label>
      {control}
      {f.hint && <span className="text-[11px] text-soft">{f.hint}</span>}
    </div>
  );
}

/** Several images, one path per line, with thumbnails and an upload button that appends. */
function ImageList({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
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
        <summary className="cursor-pointer">Sửa danh sách đường dẫn</summary>
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${input} mt-2 h-auto py-2 font-mono text-[12px]`} />
      </details>
    </div>
  );
}

/** Table + search + create/edit drawer for one admin resource (config in resources.ts). */
export default function ResourceManager({ resource }: { resource: string }) {
  const cfg = RESOURCES[resource];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ row: Row | null; values: Values } | null>(null);
  const [saveErr, setSaveErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setRows(await adminFetch<Row[]>(`/admin/${resource}`));
      setLoadErr("");
    } catch (e) {
      setLoadErr((e as Error).message);
    }
  }, [resource]);
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !k || cfg.columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(k)));
  }, [rows, q, cfg]);

  const open = (row: Row | null) => {
    setSaveErr("");
    setEditing({ row, values: toValues(cfg.fields, row ?? cfg.defaults) });
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setSaveErr("");
    try {
      const isNew = !editing.row;
      const payload = toPayload(cfg.fields, editing.values, isNew ? undefined : cfg.key);
      if (isNew) await adminFetch(`/admin/${resource}`, { method: "POST", body: payload });
      else await adminFetch(`/admin/${resource}/${encodeURIComponent(String(editing.row![cfg.key]))}`, { method: "PUT", body: payload });
      setEditing(null);
      setNotice(`Đã lưu ${cfg.singular}. Website cập nhật trong khoảng 1 phút.`);
      load();
    } catch (err) {
      setSaveErr(viMessage((err as Error).message, cfg.fields));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    const label = String(row.title ?? row.name ?? row[cfg.key]);
    if (!window.confirm(`Xoá ${cfg.singular} "${label}"? Không thể hoàn tác.`)) return;
    try {
      await adminFetch(`/admin/${resource}/${encodeURIComponent(String(row[cfg.key]))}`, { method: "DELETE" });
      setNotice(`Đã xoá ${cfg.singular}.`);
      load();
    } catch (err) {
      setNotice((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-esp">{cfg.title}</h1>
          <p className="text-[13px] text-muted">{rows ? `${rows.length} ${cfg.singular}` : "Đang tải…"}</p>
        </div>
        <div className="flex gap-2">
          <label className="flex h-10 items-center gap-2 rounded border border-line bg-white px-3 text-[13px]">
            <Icon name="search" size={14} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm…" aria-label="Tìm kiếm" className="w-40 bg-transparent focus:outline-none" />
          </label>
          <button onClick={() => open(null)} className="btn-gold h-10 !py-0">
            + THÊM {cfg.singular.toUpperCase()}
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="flex items-center justify-between rounded border border-verified/30 bg-[#E8F3EC] px-4 py-2.5 text-[13px] text-verified">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Đóng" className="text-[16px]">
            ×
          </button>
        </p>
      )}
      {loadErr && <p className="rounded border border-price/30 bg-price/5 px-4 py-3 text-[13px] text-price">{loadErr}</p>}

      {rows && !shown.length ? (
        <Empty>{q ? "Không có kết quả phù hợp." : `Chưa có ${cfg.singular} nào.`}</Empty>
      ) : (
        <div className="overflow-x-auto rounded border border-lineL bg-white">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="bg-cream text-[11px] uppercase tracking-[0.06em] text-muted">
              <tr>
                {cfg.columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={String(r[cfg.key])} className="border-t border-lineL hover:bg-page">
                  {cfg.columns.map((c) => (
                    <td key={c.key} className="max-w-[280px] truncate px-4 py-3 text-ink">
                      {c.format ? c.format(r[c.key], r) : String(r[c.key] ?? "")}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {cfg.view &&
                      (cfg.view(r) ? (
                        <Link href={cfg.view(r)!} target="_blank" className="mr-3 text-[12px] font-semibold text-muted hover:text-esp">
                          Xem
                        </Link>
                      ) : (
                        <span className="mr-3 text-[12px] text-soft">Đang ẩn</span>
                      ))}
                    <button onClick={() => open(r)} className="mr-3 text-[12px] font-semibold text-gold hover:text-esp">
                      Sửa
                    </button>
                    <button onClick={() => remove(r)} className="text-[12px] font-semibold text-price">
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label={editing.row ? `Sửa ${cfg.singular}` : `Thêm ${cfg.singular}`} onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[640px] animate-fadeIn flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-lineL px-6 py-4">
              <h2 className="text-[18px] font-bold text-esp">{editing.row ? `Sửa ${cfg.singular}: ${String(editing.row[cfg.key])}` : `Thêm ${cfg.singular}`}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Đóng">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {cfg.fields
                .filter((f) => !(editing.row && f.name === cfg.key))
                .map((f) => (
                  <FieldInput key={f.name} f={f} value={editing.values[f.name] ?? ""} set={(v) => setEditing((s) => s && { ...s, values: { ...s.values, [f.name]: v } })} />
                ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-lineL px-6 py-4">
              {saveErr && <p className="whitespace-pre-line rounded border border-price/30 bg-price/5 px-3 py-2 text-[12px] text-price">{saveErr}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded border border-line px-4 py-2.5 text-[13px] font-semibold text-esp">
                  Huỷ
                </button>
                <button disabled={saving} className="btn-dark disabled:opacity-60">
                  {saving ? "ĐANG LƯU…" : "LƯU"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
