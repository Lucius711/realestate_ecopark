// Run: npx tsx src/components/admin/form.check.ts — self-check for card lists, slugs and Vietnamese errors.
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
assert.equal(p.beforeSave!({ name: "Sky Oasis", slug: "" }, true).slug, "sky-oasis");
const vid = RESOURCES.videos.beforeSave!({ url: "https://www.tiktok.com/@a/video/7301234567890123456" }, true);
assert.deepEqual([vid.platform, vid.embedId], ["tiktok", "7301234567890123456"]);
console.log("form.check ok");
