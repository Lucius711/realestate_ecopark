"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { postLead } from "@/lib/api";
import { authHeader } from "@/lib/auth";
import type { LeadInput } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

type State = "closed" | "ok" | "error";
const Ctx = createContext<{ submit: (lead: LeadInput) => Promise<boolean>; showSuccess: () => void } | null>(null);

export function useLead() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLead must be used inside <LeadProvider>");
  return c;
}

/** Holds the "Đã gửi yêu cầu!" overlay (Figma: "Overlay — Gửi thành công") and the lead POST. */
export function LeadProvider({ children, lang = "vi" }: { children: ReactNode; lang?: Lang }) {
  const [state, setState] = useState<State>("closed");
  const closeRef = useRef<HTMLButtonElement>(null);
  const t = dict[lang].modal;

  const submit = useCallback(async (lead: LeadInput) => {
    const ok = await postLead(lead, authHeader());
    setState(ok ? "ok" : "error");
    return ok;
  }, []);
  const showSuccess = useCallback(() => setState("ok"), []);

  useEffect(() => {
    if (state === "closed") return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState("closed");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  return (
    <Ctx.Provider value={{ submit, showSuccess }}>
      {children}
      {state !== "closed" && (
        <div role="dialog" aria-modal="true" aria-labelledby="lead-title" className="fixed inset-0 z-[60] flex animate-fadeIn items-center justify-center bg-black/55 p-4" onClick={() => setState("closed")}>
          <div className="flex w-full max-w-[460px] flex-col items-center gap-3.5 rounded-lg bg-white px-10 py-9 text-center" onClick={(e) => e.stopPropagation()}>
            <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
              <circle cx="28" cy="28" r="27" fill={state === "ok" ? "#B08A4F" : "#B03A2E"} />
              {state === "ok" ? (
                <path d="m17 29 7 7 15-16" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M20 20l16 16M36 20 20 36" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              )}
            </svg>
            <h2 id="lead-title" className="text-[28px] font-extrabold text-esp">
              {state === "ok" ? t.title : "Lỗi gửi yêu cầu"}
            </h2>
            <p className="text-[15px] text-muted">{state === "ok" ? t.body : t.error}</p>
            <button ref={closeRef} className="btn-dark mt-1" onClick={() => setState("closed")}>
              {t.close}
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
