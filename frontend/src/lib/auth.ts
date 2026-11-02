"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { API } from "./api";

export type Me = { id: number; username: string | null; email: string | null; emailVerified: boolean; role: "admin" | "member"; fullName: string | null; phone: string | null };

const KEY = "ecopark_token";
const EVENT = "ecopark-auth"; // tells every useMe() on the page that login state changed

// shortcut: token lives in localStorage (simple, survives reloads); move to an httpOnly cookie if XSS risk grows.
export const token = {
  get: () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set: (v: string | null) => {
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch {
      /* storage blocked */
    }
    token.refresh();
  },
  /** Same token, fresh profile: every useMe() re-reads /auth/me (e.g. after a profile edit). */
  refresh: () => window.dispatchEvent(new Event(EVENT)),
};

export const authHeader = (): Record<string, string> => {
  const t = token.get();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
export const isAdmin = (me: Me) => me.role === "admin";
export const displayName = (me: Me) => me.fullName || me.username || me.email || "Tài khoản";
/** Where to land after signing in when no ?next= was given. */
export const homeFor = (me: Me) => (isAdmin(me) ? "/admin" : "/account");

/** Signed-in fetch to the API; throws Error(readable message). */
export async function apiFetch<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: init.method ?? "GET",
      headers: { ...authHeader(), ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new Error("Không kết nối được máy chủ");
  }
  if (res.status === 401 && token.get()) {
    token.set(null);
    throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const m = data?.message;
    throw new Error(Array.isArray(m) ? m.join("\n") : typeof m === "string" ? m : `Lỗi ${res.status}`);
  }
  return data as T;
}

/** POST /auth/login or /auth/register; stores the token and returns the user. */
export async function authRequest(path: "login" | "register", body: Record<string, string>): Promise<Me> {
  const data = await apiFetch<{ accessToken: string; user: Me }>(`/auth/${path}`, { method: "POST", body });
  token.set(data.accessToken);
  return data.user;
}

// Last known profile, so the header and /admin render signed-in at once instead of flashing
// "checking…" on every page; /auth/me still re-checks in the background (the API enforces roles anyway).
const ME_KEY = "ecopark_me";
let memo: Me | null | undefined; // survives client-side navigation
function cached(): Me | null | undefined {
  if (!token.get()) return null;
  try {
    return JSON.parse(localStorage.getItem(ME_KEY) ?? "null") ?? undefined;
  } catch {
    return undefined;
  }
}
function remember(me: Me | null) {
  memo = me;
  try {
    if (me) localStorage.setItem(ME_KEY, JSON.stringify(me));
    else localStorage.removeItem(ME_KEY);
  } catch {
    /* storage blocked */
  }
}

function useMeState(enabled: boolean) {
  const [me, setMe] = useState<Me | null | undefined>(memo);
  // Before the first paint (no flicker); the server render can't see localStorage, so this can't go in useState.
  useLayoutEffect(() => {
    if (enabled && memo === undefined) setMe(cached());
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    const load = async () => {
      const fresh = token.get() ? await apiFetch<Me>("/auth/me").catch(() => null) : null;
      remember(fresh);
      setMe(fresh);
    };
    load();
    window.addEventListener(EVENT, load);
    return () => window.removeEventListener(EVENT, load);
  }, [enabled]);
  return me;
}

// ---- shared on site pages via <AuthProvider>: one /auth/me + one /me/favorites request per page ----
type Ctx = { me: Me | null | undefined; favs: Set<string>; toggleFav: (code: string) => Promise<void> };
const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const me = useMeState(true);
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!me) return setFavs(new Set());
    apiFetch<{ code: string }[]>("/me/favorites")
      .then((list) => setFavs(new Set(list.map((p) => p.code))))
      .catch(() => setFavs(new Set()));
  }, [me]);

  const toggleFav = useCallback(
    async (code: string) => {
      if (me === undefined) return; // still checking the session: don't bounce a signed-in user to /login
      if (me === null) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      const saved = favs.has(code);
      const flip = (add: boolean) =>
        setFavs((s) => {
          const n = new Set(s);
          if (add) n.add(code);
          else n.delete(code);
          return n;
        });
      flip(!saved); // optimistic, rolled back if the API fails
      try {
        await apiFetch(`/me/favorites/${encodeURIComponent(code)}`, { method: saved ? "DELETE" : "POST" });
      } catch {
        flip(saved);
      }
    },
    [me, favs],
  );

  return createElement(AuthCtx.Provider, { value: { me, favs, toggleFav } }, children);
}

/** Current user (null = signed out, undefined = still checking). Uses <AuthProvider> when present. */
export function useMe() {
  const ctx = useContext(AuthCtx);
  const own = useMeState(!ctx);
  return ctx ? ctx.me : own;
}

export function useFavorites() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useFavorites must be used inside <AuthProvider>");
  return ctx;
}
