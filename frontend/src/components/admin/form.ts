// Admin form plumbing: DB row ⇄ form strings ⇄ API payload, and API errors in Vietnamese.
import type { Field } from "./resources";

export type Row = Record<string, unknown>;
export type Values = Record<string, string | boolean>;

// Record → form strings (lists one per line, card lists as JSON the card editor reads).
export function toValues(fields: Field[], row: Row): Values {
  const v: Values = {};
  for (const f of fields) {
    const x = row[f.name];
    if (f.type === "checkbox") v[f.name] = Boolean(x);
    else if (f.type === "list") v[f.name] = Array.isArray(x) ? x.join("\n") : "";
    else if (f.type === "repeat") v[f.name] = JSON.stringify(x ?? []);
    else if (f.type === "stamp") v[f.name] = x ? String(x) : "";
    else v[f.name] = x == null ? "" : String(x);
  }
  return v;
}

// Form strings → API payload. Throws a readable message for missing fields / bad numbers.
export function toPayload(fields: Field[], v: Values, skip?: string): Row {
  const out: Row = {};
  const missing: string[] = [];
  for (const f of fields) {
    if (f.name === skip) continue;
    const raw = v[f.name];
    if (f.type === "checkbox") out[f.name] = Boolean(raw);
    else if (f.type === "stamp") out[f.name] = raw ? String(raw) : null;
    else if (f.type === "list") {
      out[f.name] = String(raw).split("\n").map((s) => s.trim()).filter(Boolean);
      if (f.required && !(out[f.name] as string[]).length) missing.push(f.label);
    }
    else if (f.type === "repeat") {
      // Trim every box and drop cards left completely empty (e.g. "+ Thêm" pressed by mistake).
      const items = (JSON.parse(String(raw) || "[]") as Row[]).map((it) => Object.fromEntries(f.item!.map((x) => [x.name, String(it[x.name] ?? "").trim()])));
      const kept = items.filter((it) => Object.values(it).some(Boolean));
      // Every box of a card is required by the API; say which card and box is still empty.
      kept.forEach((it, i) => f.item!.forEach((x) => !it[x.name] && missing.push(`${f.label} › ${f.itemLabel ?? "Mục"} ${i + 1} › ${x.label}`)));
      out[f.name] = kept;
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
export function viMessage(msg: string, fields: Field[]) {
  return msg
    .split("\n")
    .map((line) => {
      let out = line;
      for (const [re, vi] of PHRASES) out = out.replace(re, vi);
      // Card list error "amenities.2.image: <msg>" → "Tiện ích › Tiện ích 3 › Ảnh: <msg>" (the API repeats the key before the message).
      const m = /^(\w+)\.(\d+)\.(\w+): (?:\3 )?(.*)$/.exec(out);
      const rf = m && fields.find((x) => x.name === m[1] && x.item);
      if (m && rf) return `${rf.label} › ${rf.itemLabel ?? "Mục"} ${Number(m[2]) + 1} › ${rf.item!.find((x) => x.name === m[3])?.label ?? m[3]}: ${m[4]}`;
      const f = fields.find((x) => out.startsWith(x.name + " ") || out.startsWith(x.name + ".") || out.startsWith(x.name + ":"));
      return f ? `${f.label}${out.slice(f.name.length).replace(/^\./, " › ")}` : out;
    })
    .join("\n");
}
