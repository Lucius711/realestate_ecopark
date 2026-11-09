// Line icons copied from the SVG paths used in the Figma design (24×24 viewBox).
import type { SVGProps } from "react";

const P: Record<string, string> = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevL: "m15 5-7 7 7 7",
  chevR: "m9 5 7 7-7 7",
  chevD: "m6 9 6 6 6-6",
  chevU: "m6 15 6-6 6 6",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M18 6 6 18M6 6l12 12",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8",
  bulb: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z",
  chart: "M3 21h18M5 12h3v7H5zM10.5 8h3v11h-3zM16 4h3v15h-3z",
  heart: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7",
  phone:
    "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  bed: "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 17h20M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",
  bath: "M4 12h16a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 3.4-1.4",
  area: "M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5",
  floor: "M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1",
  image: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21",
  check: "M20 6 9 17l-5-5",
  filter: "M3 5h18M6 12h12M10 19h4",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  map: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4zM8 2v16M16 6v16",
  cam: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16 8l-2 6-6 2 2-6z",
  sofa: "M4 18v2M20 18v2M3 11a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v7H3zM5 9V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  mute: "M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6",
  layers: "M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
};

const FILLED: Record<string, string> = {
  play: "M8 5v14l11-7z",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  facebook:
    "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V10.5H7.8v3h2.6V21z",
  tiktok: "M16 3c.4 2.3 1.9 3.9 4.5 4.2v3.2c-1.6 0-3.1-.5-4.4-1.3v6.4A5.5 5.5 0 1 1 10.6 10v3.3a2.3 2.3 0 1 0 2.2 2.3V3z",
  youtube:
    "M22 8.2c-.2-1.6-1-2.6-2.6-2.8C16.9 5 12 5 12 5s-4.9 0-7.4.4C3 5.6 2.2 6.6 2 8.2 1.8 9.5 1.8 12 1.8 12s0 2.5.2 3.8c.2 1.6 1 2.6 2.6 2.8C7.1 19 12 19 12 19s4.9 0 7.4-.4c1.6-.2 2.4-1.2 2.6-2.8.2-1.3.2-3.8.2-3.8s0-2.5-.2-3.8zM10 15V9l5.2 3z",
  quoteMark:
    "M3 21c3 0 7-1 7-8V5c0-1.3-.8-2-2-2H4c-1.3 0-2 .8-2 2v6c0 1.2.8 2 2 2h3c0 4-2 6-4 6zM15 21c3 0 7-1 7-8V5c0-1.3-.8-2-2-2h-4c-1.3 0-2 .8-2 2v6c0 1.2.8 2 2 2h3c0 4-2 6-4 6z",
};

export type IconName = keyof typeof P | keyof typeof FILLED | "zalo";

export function Icon({ name, size = 16, strokeWidth = 1.8, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  if (name === "zalo") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
        <path d="M12 3C6.5 3 2 6.7 2 11.3c0 2.6 1.4 4.9 3.7 6.4L5 21l3.6-1.9c1.1.3 2.2.5 3.4.5 5.5 0 10-3.7 10-8.3S17.5 3 12 3z" fill="currentColor" />
        <text x="12" y="13.8" fontFamily="Arial" fontWeight="700" fontSize="6.5" fill="#B08A4F" textAnchor="middle">
          Zalo
        </text>
      </svg>
    );
  }
  if (name in FILLED) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
        <path d={FILLED[name]} fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      <path d={P[name]} />
    </svg>
  );
}
