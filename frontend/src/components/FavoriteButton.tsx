"use client";

import { Icon } from "./Icons";
import { useFavorites } from "@/lib/auth";

/** ♡ Lưu — toggles a saved listing; signed-out visitors are sent to /login and come back here. */
export default function FavoriteButton({ code, withLabel = false, className = "" }: { code: string; withLabel?: boolean; className?: string }) {
  const { favs, toggleFav } = useFavorites();
  const saved = favs.has(code);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault(); // cards are links; don't navigate
        e.stopPropagation();
        toggleFav(code);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Bỏ lưu căn này" : "Lưu căn này"}
      title={saved ? "Bỏ lưu" : "Lưu căn"}
      className={className}
    >
      <Icon name="heart" size={withLabel ? 15 : 16} className={saved ? "fill-price text-price" : ""} />
      {withLabel && (saved ? "Đã lưu" : "Lưu")}
    </button>
  );
}
