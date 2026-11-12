import type { Property } from "./types";

export const areaLabel = (p: Property) => `${p.areaM2} m²${p.landArea ? " đất" : ""}`;

/** Price per m²: "219k/m²" for rent (monthly), "50,7 tr/m²" for sale. */
export function pricePerM2(p: Property) {
  if (!p.areaM2) return "";
  const v = p.priceMillion / p.areaM2;
  return p.type === "rent" ? `${Math.round(v * 1000)}k/m²` : `${v.toFixed(1).replace(".", ",")} tr/m²`;
}

/** Management fee per m² per month, or "Theo BQL" while the building has none. */
export const feePerM2 = (fee?: number | null) => (fee ? `${fee.toLocaleString("vi-VN")}đ/m²/tháng` : "Theo BQL");

export const TYPE_LABEL = { rent: "CHO THUÊ", resale: "CHUYỂN NHƯỢNG", project: "DỰ ÁN" } as const;
