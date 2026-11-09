// Run: npx tsx src/components/admin/form.check.ts — self-check for card lists, slugs and Vietnamese errors.
import { autoPriceLabel, autoTitle } from "./resources";
import assert from "node:assert";
import { toPayload, toValues, viMessage } from "./form";
import { RESOURCES, slugify } from "./resources";

const p = RESOURCES.projects;
const am = p.fields.filter((f) => f.name === "amenities");
const v = toValues(am, { amenities: [{ name: "Bể bơi", image: "/images/a.webp" }] });
const items = JSON.parse(String(v.amenities));
items.push({ name: "", image: "" }, { name: "  Gym ", image: "" });
v.amenities = JSON.stringify(items);
assert.throws(() => toPayload(am, v), /Tiện ích › Tiện ích 2 › Ảnh: bắt buộc/, "empty card dropped, half-filled card reported");
items[2].image = "/images/g.webp";
v.amenities = JSON.stringify(items);
assert.deepEqual(toPayload(am, v).amenities, [{ name: "Bể bơi", image: "/images/a.webp" }, { name: "Gym", image: "/images/g.webp" }]);

assert.equal(viMessage("policies.0.title: title must be longer than or equal to 1 characters", p.fields), "Chính sách bán hàng › Chính sách 1 › Tên chính sách: phải có ít nhất 1 ký tự");
assert.equal(slugify("Ecopark Grand – The Island Đảo"), "ecopark-grand-the-island-dao");
assert.equal(p.beforeSave!({ name: "Sky Oasis", slug: "" }, true, {}).slug, "sky-oasis");
const vid = RESOURCES.videos.beforeSave!({ url: "https://www.tiktok.com/@a/video/7301234567890123456" }, true, {});
assert.deepEqual([vid.platform, vid.embedId], ["tiktok", "7301234567890123456"]);

// Listings: a new one gets its own code and an auto title; a building fills in the phân khu; the description template uses the form.
const pr = RESOURCES.properties;
const lk = { buildings: [{ id: 7, name: "S1.02", district: "Aquabay", managementFee: 12000 }] };
const created = pr.beforeSave!({ type: "resale", title: "", bedrooms: 2, areaM2: 75, buildingId: 7, district: "Aquabay" }, true, lk);
assert.match(String(created.code), /^CN-[2-9A-HJ-NP-Z]{6}$/);
assert.equal(created.title, "Chuyển nhượng căn 2PN 75m² tòa S1.02");
assert.equal(pr.beforeSave!({ type: "rent", title: "Giữ nguyên", areaM2: 50 }, false, lk).code, undefined, "editing never changes the code");
assert.equal(pr.beforeSave!({ type: "rent", title: "Giữ nguyên" }, false, lk).title, "Giữ nguyên");
assert.deepEqual(pr.autofill!("buildingId", "7", lk), { district: "Aquabay" });
assert.deepEqual(pr.autofill!("buildingId", "", lk), {});
assert.deepEqual(pr.autofill!("title", "x", lk), {});
const copy = pr.copy!({ code: "CN-AAAAAA", status: "available", pinned: true, verifiedAt: "2026-01-01", images: ["/images/a.webp"], title: "T" });
assert.deepEqual([copy.code, copy.status, copy.pinned, copy.verifiedAt, copy.images], [undefined, "draft", false, null, ["/images/a.webp"]]);
const desc = pr.fields.find((f) => f.name === "description")!.template!(toValues(pr.fields, { type: "rent", bedrooms: 2, areaM2: 75, buildingId: 7, district: "Aquabay", floorLabel: "Tầng 12", direction: "Đông Nam", legal: "Sổ hồng" }), lk);
assert.match(desc, /^Cho thuê căn 2 phòng ngủ, 75 m² tại tòa S1\.02, phân khu Aquabay, Ecopark\.\nTầng: Tầng 12 · Hướng Đông Nam · Pháp lý: Sổ hồng\n/);
const b = toPayload(RESOURCES.buildings.fields, { name: " S1.02 ", district: "Aquabay", managementFee: "" });
assert.deepEqual(b, { name: "S1.02", district: "Aquabay", managementFee: null }, "empty fee = null (Theo BQL)");
assert.equal(toPayload(RESOURCES.buildings.fields, { name: "A", district: "Aquabay", managementFee: "12000" }).managementFee, 12000);
assert.equal(toPayload(pr.fields.filter((f) => f.name === "buildingId"), { buildingId: "7" }).buildingId, 7, "building id is sent as a number");
assert.equal(toPayload(pr.fields.filter((f) => f.name === "buildingId"), { buildingId: "" }).buildingId, null);
assert.throws(() => toPayload(RESOURCES.buildings.fields, { name: "A", district: "", managementFee: "" }), /Phân khu: bắt buộc/, "a building needs a phân khu");
assert.equal(toPayload(RESOURCES.districts.fields, { name: " Sân Golf ", sortOrder: "30" }).sortOrder, 30);
console.log("form.check ok");

// Typed once: the visible price and the title follow the form.
assert.equal(autoPriceLabel({ type: "rent", priceMillion: "7" }), "7 triệu/tháng");
assert.equal(autoPriceLabel({ type: "resale", priceMillion: "3850" }), "3,85 tỷ");
assert.equal(autoPriceLabel({ type: "project", priceMillion: "4800" }), "Từ 4,8 tỷ");
assert.equal(autoPriceLabel({ type: "rent", priceMillion: "" }), "");
assert.equal(autoTitle({ type: "rent" }, {}), "", "no place yet, no title");
assert.equal(autoTitle({ type: "rent", bedrooms: "2", areaM2: "55", district: "Aquabay" }, {}), "Cho thuê căn 2PN 55m² phân khu Aquabay");
