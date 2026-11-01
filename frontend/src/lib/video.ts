import type { Video } from "./types";

/** A listing's review link (TikTok / YouTube) as the Video the popup player understands. Null for links we can't embed. */
export function videoFromUrl(url: string | null | undefined, title: string, thumbnail: string): Video | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const yt = u.hostname.endsWith("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v") ?? /\/(?:shorts|embed)\/([\w-]+)/.exec(u.pathname)?.[1];
  const tt = /\/video\/(\d+)/.exec(u.pathname)?.[1];
  const platform = u.hostname.includes("tiktok") ? "tiktok" : "youtube";
  const embedId = (platform === "tiktok" ? tt : yt) || null;
  return { id: 0, platform, title, url, embedId, thumbnail, views: "", featured: false };
}

/** "✓ Đã xem thực tế · 12/10/2026" */
export const verifiedLabel = (iso: string) => `Đã xem thực tế · ${new Date(iso).toLocaleDateString("vi-VN")}`;
