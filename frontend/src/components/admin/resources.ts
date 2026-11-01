// What each admin table shows and edits. Field rules mirror backend/src/dto.ts (the API re-validates everything).

export type FieldType = "text" | "textarea" | "number" | "select" | "checkbox" | "image" | "list" | "json";
export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Empty input is sent as null (nullable DB column) instead of "". */
  nullable?: boolean;
  /** Select whose values are numbers (sent as number, not string). */
  numeric?: boolean;
  /** File types for the upload button of an "image" field (default images). */
  accept?: string;
  hint?: string;
};
export type Column = { key: string; label: string; format?: (v: unknown, row: Record<string, unknown>) => string };
export type ResourceConfig = {
  title: string;
  singular: string;
  key: string;
  /** Public page for a row, opened from the table. */
  /** Public page of a row; null when the site doesn't show it (e.g. a hidden listing would 404). */
  view?: (row: Record<string, unknown>) => string | null;
  columns: Column[];
  fields: Field[];
  defaults: Record<string, unknown>;
};

const IMG_HINT = "Đường dẫn ảnh trong frontend/public, vd /images/abc.webp";
const yesNo = (v: unknown) => (v ? "Có" : "—");
const TYPES = [
  { value: "rent", label: "Cho thuê" },
  { value: "resale", label: "Chuyển nhượng" },
  { value: "project", label: "Hàng dự án" },
];
const DISTRICTS = ["Rừng Cọ", "Quận Đảo", "Giáo dục", "Sân Golf", "Sáng tạo", "Aquabay"].map((d) => ({ value: d, label: d }));

export const RESOURCES: Record<string, ResourceConfig> = {
  properties: {
    title: "Bất động sản",
    singular: "căn",
    key: "code",
    view: (r) => (r.published ? `/property/${r.code}` : null),
    columns: [
      { key: "code", label: "Mã" },
      { key: "title", label: "Tiêu đề" },
      { key: "type", label: "Loại", format: (v) => TYPES.find((t) => t.value === v)?.label ?? String(v) },
      { key: "priceLabel", label: "Giá" },
      { key: "district", label: "Phân khu" },
      { key: "published", label: "Hiển thị", format: yesNo },
    ],
    fields: [
      { name: "code", label: "Mã căn", type: "text", required: true, hint: "In hoa, số, dấu -, vd ECO-1801. Không đổi được sau khi tạo." },
      { name: "type", label: "Loại", type: "select", options: TYPES, required: true },
      { name: "title", label: "Tiêu đề", type: "text", required: true },
      { name: "priceLabel", label: "Giá hiển thị", type: "text", required: true, hint: "vd: 7 triệu/tháng, 3,85 tỷ, Từ 4,8 tỷ" },
      { name: "priceMillion", label: "Giá (triệu đồng)", type: "number", required: true, hint: "Dùng để lọc và sắp xếp. Cho thuê: giá mỗi tháng." },
      { name: "district", label: "Phân khu", type: "select", options: DISTRICTS, required: true },
      { name: "areaM2", label: "Diện tích (m²)", type: "number", required: true },
      { name: "landArea", label: "Diện tích là diện tích đất", type: "checkbox" },
      { name: "bedrooms", label: "Phòng ngủ", type: "number", nullable: true },
      { name: "bathrooms", label: "Phòng tắm", type: "number", nullable: true },
      { name: "floorLabel", label: "Tầng", type: "text", hint: "vd: Tầng 12, 3 tầng, Bàn giao 2027" },
      { name: "direction", label: "Hướng", type: "text", nullable: true },
      { name: "furniture", label: "Nội thất", type: "text", nullable: true },
      { name: "legal", label: "Pháp lý", type: "text", nullable: true },
      { name: "projectSlug", label: "Thuộc dự án (slug)", type: "text", nullable: true, hint: "vd eco-retreat — để trống nếu không thuộc dự án" },
      { name: "images", label: "Ảnh (mỗi dòng một ảnh, ảnh đầu là ảnh bìa)", type: "list", required: true, hint: IMG_HINT },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "hasVideo", label: "Có video review", type: "checkbox" },
      { name: "verified", label: "Đã xác thực", type: "checkbox" },
      { name: "published", label: "Hiển thị trên website", type: "checkbox" },
    ],
    defaults: { type: "rent", district: "Rừng Cọ", landArea: false, hasVideo: false, verified: true, published: true, images: [] },
  },
  projects: {
    title: "Dự án",
    singular: "dự án",
    key: "slug",
    view: (r) => `/projects/${r.slug}`,
    columns: [
      { key: "slug", label: "Slug" },
      { key: "name", label: "Tên" },
      { key: "location", label: "Vị trí" },
      { key: "brochure", label: "Brochure", format: yesNo },
    ],
    fields: [
      { name: "slug", label: "Slug (đường dẫn)", type: "text", required: true, hint: "chữ thường, số, dấu -, vd eco-retreat. Không đổi được sau khi tạo." },
      { name: "name", label: "Tên dự án", type: "text", required: true },
      { name: "location", label: "Vị trí ngắn", type: "text", required: true, hint: "vd: Long An" },
      { name: "address", label: "Địa chỉ", type: "text", required: true },
      { name: "areaHa", label: "Diện tích (ha)", type: "number", required: true },
      { name: "tagline", label: "Tiêu đề phần Tổng quan", type: "text" },
      { name: "summary", label: "Mô tả ngắn (ảnh bìa)", type: "textarea", required: true },
      { name: "overview", label: "Tổng quan", type: "textarea", required: true },
      { name: "heroImage", label: "Ảnh bìa", type: "image", required: true, hint: IMG_HINT },
      { name: "overviewImage", label: "Ảnh phần Tổng quan", type: "image", hint: IMG_HINT },
      { name: "mapQuery", label: "Từ khoá Google Maps", type: "text", required: true },
      { name: "brochure", label: "Brochure (PDF)", type: "image", accept: "application/pdf", nullable: true, hint: "Bấm \"Tải PDF lên\" hoặc dán đường dẫn file PDF" },
      { name: "facts", label: "Thông số", type: "json", hint: '[{ "value": "220 ha", "label": "Tổng diện tích" }]' },
      { name: "productTypes", label: "Loại hình", type: "json", hint: '[{ "name": "BIỆT THỰ", "description": "...", "image": "/images/..." }]' },
      { name: "amenities", label: "Tiện ích", type: "json", hint: '[{ "name": "Bể bơi", "image": "/images/..." }]' },
      { name: "policies", label: "Chính sách bán hàng", type: "json", hint: '[{ "title": "...", "detail": "...", "image": "/images/..." }]' },
      { name: "sourceNote", label: "Ghi chú nguồn", type: "textarea" },
    ],
    defaults: { facts: [], productTypes: [], amenities: [], policies: [] },
  },
  slides: {
    title: "Slider trang chủ",
    singular: "slide",
    key: "id",
    columns: [
      { key: "sortOrder", label: "Thứ tự" },
      { key: "title", label: "Tiêu đề" },
      { key: "link", label: "Liên kết" },
      { key: "active", label: "Đang hiện", format: yesNo },
    ],
    fields: [
      { name: "title", label: "Tiêu đề", type: "text", required: true },
      { name: "location", label: "Vị trí", type: "text", required: true },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "image", label: "Ảnh", type: "image", required: true, hint: IMG_HINT },
      { name: "link", label: "Liên kết khi bấm", type: "text", required: true, hint: "Trang trong web, vd /projects/eco-retreat" },
      { name: "sortOrder", label: "Thứ tự (nhỏ hiện trước)", type: "number" },
      { name: "active", label: "Hiện trên trang chủ", type: "checkbox" },
    ],
    defaults: { sortOrder: 0, active: true, description: "" },
  },
  videos: {
    title: "Video",
    singular: "video",
    key: "id",
    columns: [
      { key: "platform", label: "Nền tảng" },
      { key: "title", label: "Tiêu đề" },
      { key: "views", label: "Lượt xem" },
      { key: "featured", label: "Ghim", format: yesNo },
    ],
    fields: [
      { name: "platform", label: "Nền tảng", type: "select", options: [{ value: "tiktok", label: "TikTok" }, { value: "youtube", label: "YouTube" }], required: true },
      { name: "title", label: "Tiêu đề", type: "text", required: true },
      { name: "url", label: "Link video", type: "text", required: true, hint: "https://www.tiktok.com/... hoặc https://youtube.com/..." },
      { name: "embedId", label: "Mã nhúng (ID video)", type: "text", nullable: true, hint: "Có mã thì video phát ngay trên web" },
      { name: "thumbnail", label: "Ảnh thu nhỏ", type: "image", required: true, hint: IMG_HINT },
      { name: "views", label: "Lượt xem", type: "text", hint: "vd: 12,4K" },
      { name: "duration", label: "Thời lượng", type: "text", nullable: true, hint: "vd: 1:05" },
      { name: "featured", label: "Ghim lên đầu", type: "checkbox" },
    ],
    defaults: { platform: "tiktok", featured: false, views: "" },
  },
  testimonials: {
    title: "Đánh giá khách hàng",
    singular: "đánh giá",
    key: "id",
    columns: [
      { key: "name", label: "Khách" },
      { key: "deal", label: "Giao dịch" },
      { key: "rating", label: "Sao", format: (v) => "★".repeat(Number(v)) },
    ],
    fields: [
      { name: "name", label: "Tên khách", type: "text", required: true },
      { name: "deal", label: "Giao dịch", type: "text", required: true, hint: "vd: Mua căn 2PN · Swan Lake" },
      { name: "quote", label: "Nội dung đánh giá", type: "textarea", required: true },
      { name: "avatar", label: "Ảnh đại diện", type: "image", nullable: true, hint: IMG_HINT },
      { name: "rating", label: "Số sao", type: "select", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} sao` })), required: true, numeric: true },
    ],
    defaults: { rating: 5 },
  },
};
