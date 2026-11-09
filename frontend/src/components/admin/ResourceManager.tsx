"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "../Icons";
import Empty from "../Empty";
import { EditDrawer, StatusSelect } from "./EditDrawer";
import { TONE } from "./fields";
import { toPayload, toValues, viMessage, type Row, type Values } from "./form";
import { RESOURCES, type Lookups } from "./resources";
import { adminFetch } from "@/lib/adminApi";

const firstImage = (v: unknown) => (Array.isArray(v) ? String(v[0] ?? "") : String(v ?? ""));

/** Table + filters + create/edit drawer for one admin resource (config in resources.ts). */
export default function ResourceManager({ resource }: { resource: string }) {
  const cfg = RESOURCES[resource];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<{ row: Row | null; values: Values; start: string; from?: string } | null>(null);
  const [lookups, setLookups] = useState<Lookups>({});
  const [saveErr, setSaveErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

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
  useEffect(() => {
    for (const name of cfg.lookups ?? []) adminFetch<Row[]>(`/admin/${name}`).then((r) => setLookups((l) => ({ ...l, [name]: r })), () => {});
  }, [cfg]);

  const open = useCallback(
    (row: Row | null) => {
      setSaveErr("");
      const values = toValues(cfg.fields, row ?? cfg.defaults);
      setEditing({ row, values, start: JSON.stringify(values) });
    },
    [cfg],
  );

  /** "Nhân bản": open the form as a new row, filled in from `row`, so a similar listing isn't typed again from scratch. */
  const duplicate = (row: Row) => {
    setSaveErr("");
    setEditing({ row: null, values: toValues(cfg.fields, cfg.copy!(row)), start: JSON.stringify(toValues(cfg.fields, cfg.defaults)), from: String(row.title ?? row[cfg.key]) });
  };

  // Deep links from the dashboard: ?status=deposit filters, ?new=1 opens the "add" form.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (cfg.filter && sp.get(cfg.filter.key)) setFilter(sp.get(cfg.filter.key)!);
    if (sp.get("new")) open(null);
  }, [cfg, open]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows?.length ?? 0 };
    if (cfg.filter) for (const r of rows ?? []) c[String(r[cfg.filter.key])] = (c[String(r[cfg.filter.key])] ?? 0) + 1;
    return c;
  }, [rows, cfg]);

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) => (filter === "all" || !cfg.filter || String(r[cfg.filter.key]) === filter) && (!k || cfg.columns.some((c) => !c.kind && String(r[c.key] ?? "").toLowerCase().includes(k))),
    );
  }, [rows, q, filter, cfg]);

  const dirty = editing ? JSON.stringify(editing.values) !== editing.start : false;
  const close = useCallback(() => {
    if (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Đóng và bỏ các thay đổi này?")) return;
    setEditing(null);
  }, [dirty]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setSaveErr("");
    try {
      const isNew = !editing.row;
      const raw = toPayload(cfg.fields, editing.values, isNew ? undefined : cfg.key);
      const payload = cfg.beforeSave ? cfg.beforeSave(raw, isNew, lookups) : raw;
      if (isNew) await adminFetch(`/admin/${resource}`, { method: "POST", body: payload });
      else await adminFetch(`/admin/${resource}/${encodeURIComponent(String(editing.row![cfg.key]))}`, { method: "PUT", body: payload });
      setEditing(null);
      setNotice({ ok: true, text: `Đã lưu ${cfg.singular}. Website cập nhật trong khoảng 1 phút.` });
      load();
    } catch (err) {
      setSaveErr(viMessage((err as Error).message, cfg.fields));
    } finally {
      setSaving(false);
    }
  }

  async function quickSet(row: Row, key: string, value: string) {
    const label = cfg.fields.find((f) => f.name === key)?.options?.find((o) => o.value === value)?.label;
    setRows((rs) => rs && rs.map((r) => (r === row ? { ...r, [key]: value } : r)));
    try {
      await adminFetch(`/admin/${resource}/${encodeURIComponent(String(row[cfg.key]))}`, { method: "PUT", body: { [key]: value } });
      setNotice({ ok: true, text: `${String(row[cfg.key])}: đã chuyển sang “${label}”.` });
    } catch (err) {
      setNotice({ ok: false, text: (err as Error).message });
      load();
    }
  }

  async function remove(row: Row) {
    const label = String(row.title ?? row.name ?? row[cfg.key]);
    const hint =
      resource === "properties"
        ? "\nMẹo: căn đã bán nên chuyển sang “Đã bán / đã cho thuê” thay vì xoá, để link cũ vẫn mở được."
        : resource === "buildings"
          ? "\nCác căn thuộc tòa này vẫn còn, chỉ không còn gắn với tòa nào."
          : resource === "districts"
            ? "\nChỉ xoá được khi không còn căn hoặc tòa nào thuộc phân khu này."
            : "";
    if (!window.confirm(`Xoá ${cfg.singular} "${label}"? Không thể hoàn tác.${hint}`)) return;
    try {
      await adminFetch(`/admin/${resource}/${encodeURIComponent(String(row[cfg.key]))}`, { method: "DELETE" });
      setNotice({ ok: true, text: `Đã xoá ${cfg.singular} “${label}”.` });
      load();
    } catch (err) {
      setNotice({ ok: false, text: (err as Error).message });
    }
  }

  const statusField = cfg.fields.find((f) => f.type === "radio");
  const chip = (active: boolean) => `rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${active ? "bg-esp text-white" : "border border-line bg-white text-esp hover:bg-cream"}`;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-esp">{cfg.title}</h1>
          <p className="text-[13px] text-muted">{rows ? `${rows.length} ${cfg.singular}` : "Đang tải…"}</p>
        </div>
        <button onClick={() => open(null)} className="btn-gold h-11 !py-0">
          + THÊM {cfg.singular.toUpperCase()}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {cfg.filter ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo tình trạng">
            <button onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={chip(filter === "all")}>
              Tất cả ({counts.all})
            </button>
            {cfg.filter.options.map((o) => (
              <button key={o.value} onClick={() => setFilter(o.value)} aria-pressed={filter === o.value} className={chip(filter === o.value)}>
                <span className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${TONE[o.tone ?? "gray"].dot}`} aria-hidden />
                {o.label} ({counts[o.value] ?? 0})
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <label className="flex h-10 items-center gap-2 rounded border border-line bg-white px-3 text-[13px]">
          <Icon name="search" size={14} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={resource === "properties" ? "Tiêu đề, tầng, mã…" : "Tìm…"} aria-label="Tìm kiếm" className="w-44 bg-transparent focus:outline-none" />
        </label>
      </div>

      {notice && (
        <p role="status" className={`flex items-center justify-between gap-3 rounded border px-4 py-2.5 text-[13px] ${notice.ok ? "border-verified/30 bg-[#E8F3EC] text-verified" : "border-price/30 bg-price/5 text-price"}`}>
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label="Đóng thông báo" className="text-[18px] leading-none">
            ×
          </button>
        </p>
      )}
      {loadErr && <p className="rounded border border-price/30 bg-price/5 px-4 py-3 text-[13px] text-price">{loadErr}</p>}

      {!rows && !loadErr ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Đang tải">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-white" />
          ))}
        </div>
      ) : rows && !shown.length ? (
        <Empty>
          {q || filter !== "all" ? "Không có kết quả phù hợp với bộ lọc." : `Chưa có ${cfg.singular} nào. Bấm “+ Thêm ${cfg.singular}” để bắt đầu.`}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded border border-lineL bg-white">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-cream text-[11px] uppercase tracking-[0.06em] text-muted">
              <tr>
                {cfg.columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold">
                    {c.kind === "thumb" ? <span className="sr-only">Ảnh</span> : c.label}
                  </th>
                ))}
                <th className="px-4 py-3">
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={String(r[cfg.key])} className="border-t border-lineL align-middle hover:bg-page">
                  {cfg.columns.map((c) => (
                    <td key={c.key} className={c.kind === "thumb" ? "w-[76px] py-2 pl-4" : "max-w-[280px] truncate px-4 py-3 text-ink"}>
                      {c.kind === "thumb" ? (
                        firstImage(r[c.key]) && (
                          <span className="relative block h-11 w-16 overflow-hidden rounded bg-cream">
                            <Image src={firstImage(r[c.key])} alt="" fill sizes="64px" className="object-cover" unoptimized />
                          </span>
                        )
                      ) : c.kind === "status" && statusField ? (
                        <StatusSelect field={statusField} value={String(r[c.key])} label={`Tình trạng ${String(r[cfg.key])}`} onChange={(v) => quickSet(r, c.key, v)} />
                      ) : c.format ? (
                        c.format(r[c.key], r, lookups)
                      ) : (
                        String(r[c.key] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {cfg.view &&
                      (cfg.view(r) ? (
                        <Link href={cfg.view(r)!} target="_blank" className="mr-4 text-[12px] font-semibold text-muted hover:text-esp">
                          Xem ↗
                        </Link>
                      ) : (
                        <span className="mr-4 text-[12px] text-soft" title="Bản nháp chưa có trang trên website">
                          Chưa đăng
                        </span>
                      ))}
                    <button onClick={() => open(r)} className="mr-4 text-[12px] font-semibold text-gold hover:text-esp">
                      Sửa
                    </button>
                    {cfg.copy && (
                      <button onClick={() => duplicate(r)} className="mr-4 text-[12px] font-semibold text-esp hover:text-gold">
                        Nhân bản
                      </button>
                    )}
                    <button onClick={() => remove(r)} className="text-[12px] font-semibold text-price hover:underline">
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
        <EditDrawer
          title={editing.row ? `Sửa ${cfg.singular}: ${String(editing.row[cfg.key])}` : editing.from ? `Thêm ${cfg.singular} (nhân bản từ “${editing.from}”)` : `Thêm ${cfg.singular}`}
          fields={cfg.fields.filter((f) => !(editing.row && f.name === cfg.key))}
          values={editing.values}
          set={(name, v) =>
            setEditing((s) => {
              if (!s) return s;
              const values = { ...s.values, [name]: v, ...cfg.autofill?.(name, v, lookups) };
              // Template fields (the description) rewrite themselves as the form is filled in, until the admin edits them by hand.
              for (const f of cfg.fields) {
                const cur = s.values[f.name];
                if (f.template && f.name !== name && (!cur || cur === f.template(s.values, lookups))) values[f.name] = f.template(values, lookups);
              }
              return { ...s, values };
            })
          }
          onSubmit={save}
          onClose={close}
          saving={saving}
          error={saveErr}
          dirty={dirty}
        />
      )}
    </div>
  );
}
