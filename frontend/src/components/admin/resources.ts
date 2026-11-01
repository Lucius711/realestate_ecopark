import { videoFromUrl } from "@/lib/video";

// What each admin table shows and edits. Field rules mirror backend/src/dto.ts (the API re-validates everything).

/**
 * radio: big option cards with an explanation each · stamp: a checkbox that saves "when" (ISO date) instead of true/false ·
 * repeat: a list of small cards (e.g. amenities), each with the `item` fields · ref: dropdown of another table's rows ·
 * link: "where does this go" picker over the site's pages.
 */
export type FieldType = "text" | "textarea" | "number" | "select" | "radio" | "checkbox" | "stamp" | "image" | "list" | "repeat" | "ref" | "link";
export type ItemField = { name: string; label: string; type: "text" | "textarea" | "image"; placeholder?: string };
export type Tone = "green" | "amber" | "dark" | "gray";
export type Option = { value: string; label: string; hint?: string; tone?: Tone };
export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: Option[];
  /** Heading the field is grouped under in the form. */
  section?: string;
  placeholder?: string;
  required?: boolean;
  /** Empty input is sent as null (nullable DB column) instead of "". */
  nullable?: boolean;
  /** Select whose values are numbers (sent as number, not string). */
  numeric?: boolean;
  /** File types for the upload button of an "image" field (default images). */
  accept?: string;
  hint?: string;
  /** repeat: the fields of one card, the word for one card ("Tiện ích"), and the most cards allowed (mirrors the DTO). */
  item?: ItemField[];
  itemLabel?: string;
  max?: number;
  /** ref: admin resource whose rows are the options (value = its key, label = its name). */
  ref?: string;
};
/** thumb: first image as a small picture · status: coloured pill you can change right in the table. */
export type Column = { key: string; label: string; kind?: "thumb" | "status"; format?: (v: unknown, row: Record<string, unknown>) => string };
export type ResourceConfig = {
  title: string;
  singular: string;
  key: string;
  /** Public page of a row; null when the site doesn't show it (e.g. a draft would 404). */
  view?: (row: Record<string, unknown>) => string | null;
  columns: Column[];
  /** Quick filter chips above the table (with counts), e.g. by status. */
  filter?: { key: string; options: Option[] };
  fields: Field[];
  defaults: Record<string, unknown>;
  /** Last touch on the payload before it is sent, e.g. values worked out from other fields. */
  beforeSave?: (p: Record<string, unknown>, isNew: boolean) => Record<string, unknown>;
};

/** "Ecopark Grand – The Island" → "ecopark-grand-the-island" */
export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export const PROPERTY_STATUS: Option[] = [
  { value: "available", label: "Đang bán / cho thuê", hint: "Hiện trên website và gửi email cho khách đang chờ căn như thế này.", tone: "green" },
  { value: "deposit", label: "Đã đặt cọc", hint: "Vẫn hiện, gắn nhãn ĐÃ CỌC; nút “Đặt lịch xem” đổi thành “Tìm căn tương tự”.", tone: "amber" },
  { value: "sold", label: "Đã bán / đã cho thuê", hint: "Ẩn khỏi danh sách. Link cũ vẫn mở được, có dấu ĐÃ GIAO DỊCH và gợi ý căn tương tự.", tone: "dark" },
  { value: "draft", label: "Bản nháp", hint: "Chưa hiện ở đâu. Dùng khi đang soạn, chưa đủ ảnh.", tone: "gray" },
];
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
    view: (r) => (r.status !== "draft" ? `/property/${r.code}` : null),
    columns: [
      { key: "images", label: "", kind: "thumb" },
      { key: "code", label: "Mã" },
      { key: "title", label: "Tiêu đề" },
      { key: "type", label: "Loại", format: (v) => TYPES.find((t) => t.value === v)?.label ?? String(v) },
      { key: "priceLabel", label: "Giá" },
      { key: "status", label: "Tình trạng", kind: "status" },
    ],
    filter: { key: "status", options: PROPERTY_STATUS },
    fields: [
      { name: "status", label: "Tình trạng", type: "radio", options: PROPERTY_STATUS, section: "Tình trạng" },
      { name: "code", label: "Mã căn", type: "text", required: true, placeholder: "ECO-1801", hint: "Chữ in hoa, số và dấu gạch ngang. Không đổi được sau khi tạo.", section: "Thông tin chính" },
      { name: "type", label: "Loại", type: "select", options: TYPES, required: true, section: "Thông tin chính" },
      { name: "title", label: "Tiêu đề", type: "text", required: true, placeholder: "Căn 2PN Aqua Bay ban công rộng", section: "Thông tin chính" },
      { name: "district", label: "Phân khu", type: "select", options: DISTRICTS, required: true, section: "Thông tin chính" },
      { name: "projectSlug", label: "Thuộc dự án", type: "ref", ref: "projects", nullable: true, section: "Thông tin chính" },
      { name: "priceLabel", label: "Giá hiển thị", type: "text", required: true, placeholder: "12 triệu/tháng · 3,85 tỷ · Từ 4,8 tỷ", hint: "Chữ khách nhìn thấy.", section: "Giá & diện tích" },
      { name: "priceMillion", label: "Giá (triệu đồng)", type: "number", required: true, placeholder: "12", hint: "Chỉ ghi số, dùng để lọc và sắp xếp. Cho thuê: giá mỗi tháng. 3,85 tỷ = 3850.", section: "Giá & diện tích" },
      { name: "areaM2", label: "Diện tích (m²)", type: "number", required: true, placeholder: "75", section: "Giá & diện tích" },
      { name: "landArea", label: "Đây là diện tích đất (nhà phố, biệt thự)", type: "checkbox", section: "Giá & diện tích" },
      { name: "bedrooms", label: "Phòng ngủ", type: "number", nullable: true, placeholder: "2", section: "Giá & diện tích" },
      { name: "bathrooms", label: "Phòng tắm", type: "number", nullable: true, placeholder: "2", section: "Giá & diện tích" },
      { name: "images", label: "Ảnh", type: "list", required: true, hint: "Ảnh đầu tiên là ảnh bìa. Bấm ← để đưa ảnh lên trước.", section: "Ảnh & video" },
      { name: "videoUrl", label: "Link video review", type: "text", nullable: true, placeholder: "https://www.tiktok.com/@.../video/...", hint: "TikTok hoặc YouTube. Có link → thẻ căn hiện ▶ Video và khách xem ngay trên trang.", section: "Ảnh & video" },
      { name: "floorLabel", label: "Tầng", type: "text", placeholder: "Tầng 12 · 3 tầng · Bàn giao 2027", section: "Chi tiết" },
      { name: "direction", label: "Hướng ban công", type: "text", nullable: true, placeholder: "Đông Nam", section: "Chi tiết" },
      { name: "furniture", label: "Nội thất", type: "text", nullable: true, placeholder: "Full nội thất", section: "Chi tiết" },
      { name: "legal", label: "Pháp lý", type: "text", nullable: true, placeholder: "Sổ hồng lâu dài", section: "Chi tiết" },
      { name: "description", label: "Mô tả", type: "textarea", section: "Chi tiết" },
      { name: "verifiedAt", label: "Anh Tuấn đã xem nhà thực tế", type: "stamp", hint: "Website hiện nhãn “✓ Đã xem thực tế” kèm ngày tích.", section: "Uy tín & nổi bật" },
      { name: "pinned", label: "Ghim lên trang chủ", type: "checkbox", hint: "Luôn hiện đầu mục “Nổi bật” ở trang chủ.", section: "Uy tín & nổi bật" },
    ],
    defaults: { status: "available", type: "rent", district: "Rừng Cọ", landArea: false, pinned: false, verifiedAt: null, images: [] },
  },
  projects: {
    title: "Dự án",
    singular: "dự án",
    key: "slug",
    view: (r) => `/projects/${r.slug}`,
    columns: [
      { key: "heroImage", label: "", kind: "thumb" },
      { key: "name", label: "Tên" },
      { key: "location", label: "Vị trí" },
      { key: "brochure", label: "Brochure", format: yesNo },
    ],
    fields: [
      { name: "name", label: "Tên dự án", type: "text", required: true, placeholder: "Ecopark Grand – The Island", section: "Thông tin chung" },
      { name: "slug", label: "Đường dẫn trang", type: "text", placeholder: "Để trống – tự tạo từ tên dự án", hint: "Phần cuối địa chỉ trang, vd the-island → /projects/the-island. Không đổi được sau khi tạo.", section: "Thông tin chung" },
      { name: "location", label: "Vị trí ngắn", type: "text", required: true, placeholder: "Văn Giang, Hưng Yên", section: "Thông tin chung" },
      { name: "address", label: "Địa chỉ", type: "text", required: true, section: "Thông tin chung" },
      { name: "areaHa", label: "Diện tích (ha)", type: "number", required: true, section: "Thông tin chung" },
      { name: "tagline", label: "Tiêu đề phần Tổng quan", type: "text", section: "Nội dung" },
      { name: "summary", label: "Mô tả ngắn (ảnh bìa)", type: "textarea", required: true, section: "Nội dung" },
      { name: "overview", label: "Tổng quan", type: "textarea", required: true, section: "Nội dung" },
      { name: "heroImage", label: "Ảnh bìa", type: "image", required: true, section: "Ảnh & brochure" },
      { name: "overviewImage", label: "Ảnh phần Tổng quan", type: "image", section: "Ảnh & brochure" },
      { name: "mapQuery", label: "Tìm trên Google Maps bằng", type: "text", required: true, placeholder: "Ecopark Văn Giang Hưng Yên", hint: "Chữ anh gõ vào Google Maps để ra đúng vị trí dự án — bản đồ trên trang dùng đúng chữ này.", section: "Thông tin chung" },
      { name: "brochure", label: "Brochure (PDF)", type: "image", accept: "application/pdf", nullable: true, hint: "Khách để lại số điện thoại sẽ tải được file này.", section: "Ảnh & brochure" },
      { name: "facts", label: "Thông số nổi bật", type: "repeat", itemLabel: "Thông số", max: 8, item: [{ name: "value", label: "Con số", type: "text", placeholder: "220 ha" }, { name: "label", label: "Ý nghĩa", type: "text", placeholder: "Tổng diện tích" }], hint: "Các ô số lớn ở đầu trang, vd 220 ha · Tổng diện tích.", section: "Thông số & loại hình" },
      { name: "productTypes", label: "Loại hình sản phẩm", type: "repeat", itemLabel: "Loại hình", max: 6, item: [{ name: "name", label: "Tên loại hình", type: "text", placeholder: "Biệt thự đơn lập" }, { name: "description", label: "Mô tả ngắn", type: "textarea", placeholder: "Diện tích 200–400 m², sân vườn riêng" }, { name: "image", label: "Ảnh", type: "image" }], section: "Thông số & loại hình" },
      { name: "amenities", label: "Tiện ích", type: "repeat", itemLabel: "Tiện ích", max: 30, item: [{ name: "name", label: "Tên tiện ích", type: "text", placeholder: "Bể bơi bốn mùa" }, { name: "image", label: "Ảnh", type: "image" }], section: "Tiện ích" },
      { name: "policies", label: "Chính sách bán hàng", type: "repeat", itemLabel: "Chính sách", max: 10, item: [{ name: "title", label: "Tên chính sách", type: "text", placeholder: "Hỗ trợ vay 70%" }, { name: "detail", label: "Chi tiết", type: "textarea", placeholder: "Ân hạn gốc lãi 24 tháng…" }, { name: "image", label: "Ảnh", type: "image" }], section: "Chính sách bán hàng" },
      { name: "sourceNote", label: "Nguồn thông tin", type: "textarea", placeholder: "Theo tài liệu chủ đầu tư, tháng 10/2026", section: "Nội dung" },
    ],
    defaults: { facts: [], productTypes: [], amenities: [], policies: [] },
    beforeSave: (p, isNew) => (isNew && !p.slug ? { ...p, slug: slugify(String(p.name ?? "")) } : p),
  },
  slides: {
    title: "Slider trang chủ",
    singular: "slide",
    key: "id",
    columns: [
      { key: "image", label: "", kind: "thumb" },
      { key: "sortOrder", label: "Thứ tự" },
      { key: "title", label: "Tiêu đề" },
      { key: "link", label: "Khi bấm mở" },
      { key: "active", label: "Đang hiện", format: yesNo },
    ],
    fields: [
      { name: "title", label: "Tiêu đề", type: "text", required: true, section: "Nội dung" },
      { name: "location", label: "Vị trí", type: "text", required: true, section: "Nội dung" },
      { name: "description", label: "Mô tả", type: "textarea", section: "Nội dung" },
      { name: "image", label: "Ảnh", type: "image", required: true, section: "Nội dung" },
      { name: "link", label: "Mở trang", type: "link", required: true, section: "Khi khách bấm vào" },
      { name: "sortOrder", label: "Thứ tự (nhỏ hiện trước)", type: "number", section: "Hiển thị" },
      { name: "active", label: "Hiện trên trang chủ", type: "checkbox", section: "Hiển thị" },
    ],
    defaults: { sortOrder: 0, active: true, description: "" },
  },
  videos: {
    title: "Video",
    singular: "video",
    key: "id",
    columns: [
      { key: "thumbnail", label: "", kind: "thumb" },
      { key: "platform", label: "Nền tảng", format: (v) => (v === "tiktok" ? "TikTok" : "YouTube") },
      { key: "title", label: "Tiêu đề" },
      { key: "views", label: "Lượt xem" },
      { key: "featured", label: "Ghim", format: yesNo },
    ],
    fields: [
      { name: "title", label: "Tiêu đề", type: "text", required: true, section: "Video" },
      { name: "url", label: "Link video", type: "text", required: true, placeholder: "https://www.tiktok.com/@.../video/...", hint: "Mở video trên TikTok/YouTube → Chia sẻ → Sao chép liên kết, rồi dán vào đây. Web tự nhận nền tảng và phát video ngay trên trang.", section: "Video" },
      { name: "thumbnail", label: "Ảnh thu nhỏ", type: "image", required: true, section: "Ảnh & thông tin" },
      { name: "views", label: "Lượt xem", type: "text", placeholder: "12,4K", section: "Ảnh & thông tin" },
      { name: "duration", label: "Thời lượng", type: "text", nullable: true, placeholder: "1:05", hint: "phút:giây", section: "Ảnh & thông tin" },
      { name: "featured", label: "Ghim lên đầu", type: "checkbox", section: "Hiển thị" },
    ],
    defaults: { featured: false, views: "" },
    // Platform and embed id come from the link, so the user only pastes it.
    beforeSave: (p) => {
      if (!p.url) return p;
      const v = videoFromUrl(String(p.url), "", "");
      return { ...p, platform: v?.platform ?? "youtube", embedId: v?.embedId ?? null };
    },
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
      { name: "name", label: "Tên khách", type: "text", required: true, section: "Khách hàng" },
      { name: "deal", label: "Giao dịch", type: "text", required: true, placeholder: "Mua căn 2PN · Swan Lake", section: "Khách hàng" },
      { name: "quote", label: "Nội dung đánh giá", type: "textarea", required: true, section: "Đánh giá" },
      { name: "avatar", label: "Ảnh đại diện", type: "image", nullable: true, section: "Khách hàng" },
      { name: "rating", label: "Số sao", type: "select", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} sao` })), required: true, numeric: true, section: "Đánh giá" },
    ],
    defaults: { rating: 5 },
  },
};
