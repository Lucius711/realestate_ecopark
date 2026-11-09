import { videoFromUrl } from "@/lib/video";
import type { Values } from "./form";

// What each admin table shows and edits. Field rules mirror backend/src/dto.ts (the API re-validates everything).

/**
 * radio: big option cards with an explanation each · stamp: a checkbox that saves "when" (ISO date) instead of true/false ·
 * repeat: a list of small cards (e.g. amenities), each with the `item` fields · ref: dropdown of another table's rows ·
 * link: "where does this go" picker over the site's pages.
 */
export type FieldType = "text" | "textarea" | "number" | "select" | "radio" | "checkbox" | "stamp" | "image" | "list" | "repeat" | "ref" | "link";
export type ItemField = { name: string; label: string; type: "text" | "textarea" | "image"; placeholder?: string };
export type Tone = "green" | "amber" | "dark" | "gray";
/** Rows of other admin tables the form needs (e.g. buildings), by resource name. */
export type Lookups = Record<string, Record<string, unknown>[]>;
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
  /** ref: admin resource whose rows are the options (value = row[refKey], label = row[refLabel]; defaults slug / name). */
  ref?: string;
  refKey?: string;
  refLabel?: string;
  /** textarea: a button that writes the text for the admin from the rest of the form (they can still edit it). */
  template?: (v: Values, lookups: Lookups) => string;
};
/** thumb: first image as a small picture · status: coloured pill you can change right in the table. */
export type Column = { key: string; label: string; kind?: "thumb" | "status"; format?: (v: unknown, row: Record<string, unknown>, lookups: Lookups) => string };
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
  beforeSave?: (p: Record<string, unknown>, isNew: boolean, lookups: Lookups) => Record<string, unknown>;
  /** Admin tables whose rows the form needs (loaded once when the page opens). */
  lookups?: string[];
  /** When `name` changes, other form values to set along with it (e.g. a building → its phân khu). */
  autofill?: (name: string, value: string | boolean, lookups: Lookups) => Record<string, string>;
  /** "Nhân bản": the values a new row starts with when copied from this one. */
  copy?: (row: Record<string, unknown>) => Record<string, unknown>;
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
const DIRECTIONS = ["", "Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc"].map((d) => ({ value: d, label: d || "— Chưa rõ —" }));

// Customers never see the internal code (brokers don't publish it), so the admin doesn't type one: it is generated.
const CODE_PREFIX: Record<string, string> = { rent: "T", resale: "CN", project: "DA" };
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I
export function newCode(type: string) {
  const r = crypto.getRandomValues(new Uint8Array(6));
  return `${CODE_PREFIX[type] ?? "BDS"}-${Array.from(r, (b) => CODE_CHARS[b % 32]).join("")}`;
}

const buildingOf = (lookups: Lookups, id: unknown) => lookups.buildings?.find((b) => String(b.id) === String(id));
const TYPE_VERB: Record<string, string> = { rent: "Cho thuê", resale: "Chuyển nhượng", project: "Giới thiệu" };

/** One description template for every listing: the form's own values slotted in, left for the admin to polish. */
export function describe(v: Values, lookups: Lookups) {
  if (!v.district) return "";
  const b = buildingOf(lookups, v.buildingId);
  const what = v.bedrooms ? `căn ${v.bedrooms} phòng ngủ` : "căn hộ";
  const head = `${TYPE_VERB[String(v.type)] ?? "Giới thiệu"} ${what}, ${v.areaM2 || "…"} m²${v.landArea ? " đất" : ""}${b ? ` tại tòa ${b.name}` : ""}, phân khu ${v.district}, Ecopark.`;
  const detail = [v.floorLabel && `Tầng: ${v.floorLabel}`, v.direction && `Hướng ${v.direction}`, v.furniture && `Nội thất: ${v.furniture}`, v.legal && `Pháp lý: ${v.legal}`].filter(Boolean).join(" · ");
  return [head, detail, "Liên hệ anh Tuấn để đặt lịch xem nhà."].filter(Boolean).join("\n");
}

/** Auto title from the form's own values; empty until there is a place to name. */
export function autoTitle(v: Values, lookups: Lookups) {
  const b = buildingOf(lookups, v.buildingId);
  if (!b && !v.district) return "";
  const rooms = v.bedrooms !== "" && v.bedrooms != null ? `căn ${v.bedrooms}PN` : "căn hộ";
  return [TYPE_VERB[String(v.type)], rooms, v.areaM2 ? `${v.areaM2}m²` : "", b ? `tòa ${b.name}` : `phân khu ${v.district}`].filter(Boolean).join(" ");
}

/** "Giá hiển thị" from the price in millions, so the price is typed once. */
export function autoPriceLabel(v: Values) {
  const n = Number(v.priceMillion);
  if (!v.priceMillion || !(n > 0)) return "";
  if (v.type === "rent") return `${n} triệu/tháng`;
  const text = n >= 1000 ? `${String(n / 1000).replace(".", ",")} tỷ` : `${n} triệu`;
  return v.type === "project" ? `Từ ${text}` : text;
}

export const RESOURCES: Record<string, ResourceConfig> = {
  properties: {
    title: "Bất động sản",
    singular: "căn",
    key: "code",
    view: (r) => (r.status !== "draft" ? `/property/${r.code}` : null),
    columns: [
      { key: "images", label: "", kind: "thumb" },
      { key: "title", label: "Tiêu đề" },
      { key: "buildingId", label: "Tòa", format: (v, _r, lk) => String(buildingOf(lk, v)?.name ?? "—") },
      { key: "floorLabel", label: "Tầng" },
      { key: "code", label: "Mã nội bộ" },
      { key: "type", label: "Loại", format: (v) => TYPES.find((t) => t.value === v)?.label ?? String(v) },
      { key: "priceLabel", label: "Giá" },
      { key: "status", label: "Tình trạng", kind: "status" },
    ],
    filter: { key: "status", options: PROPERTY_STATUS },
    fields: [
      { name: "status", label: "Tình trạng", type: "radio", options: PROPERTY_STATUS, section: "Tình trạng" },
      { name: "type", label: "Loại", type: "select", options: TYPES, required: true, section: "Thông tin chính" },
      { name: "buildingId", label: "Tòa", type: "ref", ref: "buildings", refKey: "id", refLabel: "name", numeric: true, nullable: true, placeholder: "— Chưa chọn tòa —", hint: "Chọn tòa thì phân khu tự điền và khách thấy phí quản lý của tòa. Chưa có tòa? Thêm ở mục “Tòa nhà”.", section: "Thông tin chính" },
      { name: "district", label: "Phân khu", type: "ref", ref: "districts", refKey: "name", placeholder: "— Chọn phân khu —", required: true, hint: "Thêm hoặc đổi tên phân khu ở mục “Phân khu”.", section: "Thông tin chính" },
      { name: "floorLabel", label: "Tầng", type: "text", placeholder: "Tầng 12", section: "Thông tin chính" },
      { name: "direction", label: "Hướng", type: "select", options: DIRECTIONS, nullable: true, section: "Thông tin chính" },
      { name: "projectSlug", label: "Thuộc dự án", type: "ref", ref: "projects", nullable: true, section: "Thông tin chính" },
      { name: "title", label: "Tiêu đề", type: "text", template: autoTitle, placeholder: "Tự điền từ loại, phòng ngủ, diện tích, tòa", hint: "Tự điền khi anh nhập thông tin; sửa tay thì giữ nguyên. Chữ khách nhìn thấy ở đầu trang căn.", section: "Thông tin chính" },
      { name: "priceLabel", label: "Giá hiển thị", type: "text", required: true, template: autoPriceLabel, placeholder: "12 triệu/tháng · 3,85 tỷ · Từ 4,8 tỷ", hint: "Tự điền từ giá (triệu đồng) bên dưới; sửa tay thì giữ nguyên. Chữ khách nhìn thấy.", section: "Giá & diện tích" },
      { name: "priceMillion", label: "Giá (triệu đồng)", type: "number", required: true, placeholder: "12", hint: "Chỉ ghi số, dùng để lọc và sắp xếp. Cho thuê: giá mỗi tháng. 3,85 tỷ = 3850.", section: "Giá & diện tích" },
      { name: "areaM2", label: "Diện tích (m²)", type: "number", required: true, placeholder: "75", section: "Giá & diện tích" },
      { name: "landArea", label: "Đây là diện tích đất (nhà phố, biệt thự)", type: "checkbox", section: "Giá & diện tích" },
      { name: "bedrooms", label: "Phòng ngủ", type: "number", nullable: true, placeholder: "2", section: "Giá & diện tích" },
      { name: "bathrooms", label: "Phòng tắm", type: "number", nullable: true, placeholder: "2", section: "Giá & diện tích" },
      { name: "images", label: "Ảnh", type: "list", required: true, hint: "Ảnh đầu tiên là ảnh bìa. Bấm ← để đưa ảnh lên trước.", section: "Ảnh & video" },
      { name: "videoUrl", label: "Link video review", type: "text", nullable: true, placeholder: "https://www.tiktok.com/@.../video/...", hint: "TikTok hoặc YouTube. Có link → thẻ căn hiện ▶ Video và khách xem ngay trên trang.", section: "Ảnh & video" },
      { name: "furniture", label: "Nội thất", type: "text", nullable: true, placeholder: "Full nội thất", section: "Chi tiết" },
      { name: "legal", label: "Pháp lý", type: "text", nullable: true, placeholder: "Sổ hồng lâu dài", section: "Chi tiết" },
      { name: "description", label: "Mô tả", type: "textarea", template: describe, hint: "Tự điền từ thông tin ở trên; sửa tay thì giữ nguyên.", section: "Chi tiết" },
      { name: "verifiedAt", label: "Anh Tuấn đã xem nhà thực tế", type: "stamp", hint: "Website hiện nhãn “✓ Đã xem thực tế” kèm ngày tích.", section: "Uy tín & nổi bật" },
      { name: "pinned", label: "Ghim lên trang chủ", type: "checkbox", hint: "Luôn hiện đầu mục “Nổi bật” ở trang chủ.", section: "Uy tín & nổi bật" },
    ],
    defaults: { status: "available", type: "rent", district: "", landArea: false, pinned: false, verifiedAt: null, images: [] },
    lookups: ["buildings"],
    autofill: (name, v, lk): Record<string, string> => {
      const b = name === "buildingId" ? buildingOf(lk, v) : undefined;
      return b ? { district: String(b.district) } : {};
    },
    // A copy starts as a draft, without the "đã xem thực tế" / pinned marks of the original, and gets its own code when saved.
    copy: (r) => ({ ...r, code: undefined, status: "draft", pinned: false, verifiedAt: null }),
    beforeSave: (p, isNew, lk) => {
      const title = String(p.title ?? "").trim() || autoTitle(p as unknown as Values, lk);
      return { ...p, title, ...(isNew ? { code: newCode(String(p.type)) } : {}) };
    },
  },
  buildings: {
    title: "Tòa nhà & phí quản lý",
    singular: "tòa",
    key: "id",
    columns: [
      { key: "name", label: "Tòa" },
      { key: "district", label: "Phân khu" },
      { key: "managementFee", label: "Phí quản lý", format: (v) => (v == null || v === "" ? "Theo BQL" : `${Number(v).toLocaleString("vi-VN")}đ/m²/tháng`) },
    ],
    fields: [
      { name: "name", label: "Tên tòa", type: "text", required: true, placeholder: "S1.02", section: "Thông tin tòa" },
      { name: "district", label: "Phân khu", type: "ref", ref: "districts", refKey: "name", placeholder: "— Chọn phân khu —", required: true, section: "Thông tin tòa" },
      { name: "managementFee", label: "Phí quản lý (đồng / m² / tháng)", type: "number", nullable: true, placeholder: "12000", hint: "Chỉ ghi số, vd 12000. Để trống = website hiện “Theo BQL”. Khách thấy phí này ở mọi căn thuộc tòa.", section: "Thông tin tòa" },
    ],
    defaults: { district: "" },
  },
  districts: {
    title: "Phân khu",
    singular: "phân khu",
    key: "id",
    columns: [
      { key: "sortOrder", label: "Thứ tự" },
      { key: "name", label: "Phân khu" },
    ],
    fields: [
      { name: "name", label: "Tên phân khu", type: "text", required: true, placeholder: "Sân Golf", hint: "Đổi tên thì mọi căn và tòa thuộc phân khu này tự đổi theo. Muốn xoá thì phải chuyển hết căn/tòa sang phân khu khác trước.", section: "Phân khu" },
      { name: "sortOrder", label: "Thứ tự (nhỏ hiện trước)", type: "number", hint: "Thứ tự trong các ô chọn và bộ lọc trên website.", section: "Phân khu" },
    ],
    defaults: { sortOrder: 0 },
  },
  costs: {
    title: "Chi phí sinh hoạt",
    singular: "khoản chi phí",
    key: "id",
    columns: [
      { key: "sortOrder", label: "Thứ tự" },
      { key: "label", label: "Khoản" },
      { key: "value", label: "Hiển thị cho khách" },
    ],
    fields: [
      { name: "label", label: "Khoản", type: "text", required: true, placeholder: "Gửi xe máy", hint: "Hiện ở mục “Chi phí hàng tháng” của mọi căn.", section: "Chi phí" },
      { name: "value", label: "Hiển thị cho khách", type: "text", required: true, placeholder: "Khoảng 120.000đ/tháng", hint: "Ghi cả đơn vị. Sửa một chỗ là đổi cho mọi căn.", section: "Chi phí" },
      { name: "sortOrder", label: "Thứ tự (nhỏ hiện trước)", type: "number", section: "Chi phí" },
    ],
    defaults: { sortOrder: 0 },
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
