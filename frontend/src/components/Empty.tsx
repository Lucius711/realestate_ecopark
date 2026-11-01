import { Icon } from "./Icons";

/** Shown wherever a list from the API comes back empty ("Không có …"). */
export default function Empty({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <p
      role="status"
      className={`flex items-center justify-center gap-2.5 rounded border border-dashed px-6 py-12 text-center text-[14px] ${dark ? "border-white/20 text-white/70" : "border-line bg-white/60 text-muted"}`}
    >
      <Icon name="search" size={16} className="shrink-0 opacity-70" />{" "}
      {children}
    </p>
  );
}
