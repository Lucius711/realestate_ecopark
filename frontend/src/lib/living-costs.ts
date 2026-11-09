// Fallback for "Chi phí hàng tháng" only when the API is down. The real list is edited in admin ("Chi phí sinh hoạt").
// Market-typical figures, not official Ecopark prices.
export const LIVING_COSTS: { label: string; value: string }[] = [
  { label: "Điện", value: "Khoảng 3.500 – 4.000đ/kWh" },
  { label: "Nước", value: "Khoảng 20.000 – 25.000đ/m³" },
  { label: "Gửi xe máy", value: "Khoảng 100.000 – 150.000đ/tháng" },
  { label: "Gửi ô tô", value: "Khoảng 1.200.000 – 1.500.000đ/tháng" },
  { label: "Internet", value: "Khoảng 180.000 – 250.000đ/tháng" },
];
