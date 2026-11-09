"use client";

import { useEffect, useState } from "react";
import { input } from "./fields";
import ImageInput from "./ImageInput";
import type { Field } from "./resources";
import { adminFetch } from "@/lib/adminApi";

type Item = Record<string, string>;

/** Rows of another admin table (e.g. projects), loaded once per editor. */
function useRows(resource: string) {
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  useEffect(() => {
    adminFetch<Record<string, unknown>[]>(`/admin/${resource}`).then(setRows, () => setRows([]));
  }, [resource]);
  return rows;
}

/** A list of small cards (amenities, policies…): add, fill in, reorder, remove — no JSON in sight. */
export function RepeatEditor({ f, id, value, set }: { f: Field; id: string; value: string; set: (v: string) => void }) {
  const items: Item[] = JSON.parse(value || "[]");
  const word = f.itemLabel ?? "mục";
  const save = (l: Item[]) => set(JSON.stringify(l));
  const edit = (i: number, k: string, v: string) => save(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i: number, d: number) => {
    const l = [...items];
    [l[i], l[i + d]] = [l[i + d], l[i]];
    save(l);
  };
  const full = f.max !== undefined && items.length >= f.max;
  const small = "rounded px-2 py-1 text-[12px] font-semibold text-muted hover:bg-cream hover:text-esp disabled:opacity-30";

  return (
    <div id={id} className="flex flex-col gap-3">
      {!items.length && <p className="rounded border border-dashed border-line bg-page px-4 py-5 text-center text-[13px] text-muted">Chưa có {word.toLowerCase()} nào. Bấm “+ Thêm {word.toLowerCase()}” bên dưới.</p>}
      {items.map((it, i) => (
        <fieldset key={i} className="flex flex-col gap-3 rounded-md border border-lineL bg-page p-4">
          <legend className="sr-only">{`${word} ${i + 1}`}</legend>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-esp">
              {word} {i + 1}
              {it[f.item![0].name] && <span className="font-normal text-muted"> · {it[f.item![0].name]}</span>}
            </span>
            <span className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Đưa ${word} ${i + 1} lên`} className={small}>
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Đưa ${word} ${i + 1} xuống`} className={small}>
                ↓
              </button>
              <button type="button" onClick={() => window.confirm(`Xoá ${word.toLowerCase()} ${i + 1}?`) && save(items.filter((_, j) => j !== i))} className={`${small} !text-price`}>
                Xoá
              </button>
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {f.item!.map((x) => {
              const xid = `${id}-${i}-${x.name}`;
              return (
                <div key={x.name} className={`flex flex-col gap-1 ${x.type === "text" && f.item!.filter((y) => y.type === "text").length > 1 ? "" : "sm:col-span-2"}`}>
                  <label htmlFor={xid} className="text-[12px] font-semibold text-esp">
                    {x.label}
                  </label>
                  {x.type === "image" ? (
                    <ImageInput id={xid} value={it[x.name] ?? ""} onChange={(v) => edit(i, x.name, v)} />
                  ) : x.type === "textarea" ? (
                    <textarea id={xid} value={it[x.name] ?? ""} onChange={(e) => edit(i, x.name, e.target.value)} rows={3} placeholder={x.placeholder} className={`${input} h-auto py-2 leading-relaxed`} />
                  ) : (
                    <input id={xid} value={it[x.name] ?? ""} onChange={(e) => edit(i, x.name, e.target.value)} placeholder={x.placeholder} className={input} />
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
      <button type="button" disabled={full} onClick={() => save([...items, Object.fromEntries(f.item!.map((x) => [x.name, ""]))])} className="w-fit rounded border border-esp px-4 py-2 text-[13px] font-semibold text-esp hover:bg-cream disabled:opacity-40">
        + Thêm {word.toLowerCase()}
      </button>
      {full && <span className="text-[12px] text-muted">Đã đủ tối đa {f.max} {word.toLowerCase()}.</span>}
    </div>
  );
}

/** Dropdown of another table's rows, e.g. "Thuộc dự án" lists the projects by name. */
export function RefSelect({ f, id, value, set }: { f: Field; id: string; value: string; set: (v: string) => void }) {
  const rows = useRows(f.ref!);
  const key = f.refKey ?? "slug";
  return (
    <select id={id} value={value} onChange={(e) => set(e.target.value)} className={input} disabled={!rows}>
      <option value="">{rows ? (f.placeholder ?? "— Không thuộc dự án nào —") : "Đang tải…"}</option>
      {rows?.map((r) => (
        <option key={String(r[key])} value={String(r[key])}>
          {String(r[f.refLabel ?? "name"])}
        </option>
      ))}
      {/* Keep a value that no longer matches a row visible instead of silently blanking it. */}
      {rows && value && !rows.some((r) => String(r[key]) === value) && <option value={value}>{value} (không còn tồn tại)</option>}
    </select>
  );
}

const PAGES = [
  { value: "/properties/for-rent", label: "Danh sách nhà cho thuê" },
  { value: "/properties/resale", label: "Danh sách nhà chuyển nhượng" },
  { value: "/properties/projects", label: "Danh sách hàng dự án" },
  { value: "/ecopark", label: "Trang Ecopark" },
  { value: "/about", label: "Trang Giới thiệu" },
  { value: "/", label: "Trang chủ" },
];
const OTHER = "__other";

/** "Where does a click go": pick one of the site's pages or projects; a free link only under "Trang khác…". */
export function LinkPicker({ id, value, set }: { id: string; value: string; set: (v: string) => void }) {
  const projects = useRows("projects");
  const options = [...PAGES, ...(projects ?? []).map((p) => ({ value: `/projects/${p.slug}`, label: `Dự án: ${p.name}` }))];
  const known = options.some((o) => o.value === value);
  const [other, setOther] = useState(false);
  const custom = other || (projects !== null && value !== "" && !known);
  return (
    <div className="flex flex-col gap-2">
      <select
        id={id}
        value={custom ? OTHER : value}
        onChange={(e) => {
          setOther(e.target.value === OTHER);
          set(e.target.value === OTHER ? "" : e.target.value);
        }}
        className={input}
      >
        <option value="" disabled>
          — Chọn trang —
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        <option value={OTHER}>Trang khác / link ngoài…</option>
      </select>
      {custom && <input value={value} onChange={(e) => set(e.target.value)} aria-label="Đường dẫn" placeholder="https://… hoặc /trang-trong-web" className={input} autoFocus />}
    </div>
  );
}
