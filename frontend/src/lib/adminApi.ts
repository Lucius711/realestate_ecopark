"use client";

import { API } from "./api";
import { token } from "./auth";

/** Calls the admin API with the stored JWT. Throws Error(message) with the API's (Vietnamese) validation text. */
export async function adminFetch<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token.get() ?? ""}`, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new Error("Không kết nối được máy chủ");
  }
  if (res.status === 401) {
    token.set(null); // expired → AdminShell sends the user back to /login
    throw new Error("Phiên đăng nhập đã hết hạn");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const m = data?.message;
    throw new Error(Array.isArray(m) ? m.join("\n") : typeof m === "string" ? m : `Lỗi ${res.status}`);
  }
  return data as T;
}

/** Uploads an image (or brochure PDF) and returns its public URL to store in the record. */
export async function uploadFile(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${API}/admin/uploads`, { method: "POST", headers: { Authorization: `Bearer ${token.get() ?? ""}` }, body });
  } catch {
    throw new Error("Không kết nối được máy chủ");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : `Tải lên thất bại (${res.status})`);
  return data.url as string;
}
