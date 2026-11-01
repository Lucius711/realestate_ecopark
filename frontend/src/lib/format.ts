import type { Property } from "./types";

export const specLine = (p: Property) =>
  [p.bedrooms != null ? `${p.bedrooms} PN` : null, p.bathrooms != null ? `${p.bathrooms} WC` : null, p.floorLabel].filter(Boolean).join(" | ");

export const areaLabel = (p: Property) => `${p.areaM2} m²${p.landArea ? " đất" : ""}`;

/** Price per m²: "219k/m²" for rent (monthly), "50,7 tr/m²" for sale. */
export function pricePerM2(p: Property) {
  if (!p.areaM2) return "";
  const v = p.priceMillion / p.areaM2;
  return p.type === "rent" ? `${Math.round(v * 1000)}k/m²` : `${v.toFixed(1).replace(".", ",")} tr/m²`;
}

export function timeAgo(iso: string, now = Date.now()) {
  const h = Math.max(1, Math.round((now - new Date(iso).getTime()) / 36e5));
  return h < 24 ? `${h} giờ trước` : `${Math.round(h / 24)} ngày trước`;
}

export const TYPE_LABEL = { rent: "CHO THUÊ", resale: "CHUYỂN NHƯỢNG", project: "DỰ ÁN" } as const;
