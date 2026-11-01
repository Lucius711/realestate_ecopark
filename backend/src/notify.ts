import { DataSource, In } from "typeorm";
import { Property, SavedSearch, SentAlert, User } from "./entities";
import { esc, sendMail } from "./mailer";

/** Does a listing satisfy a member's saved filters? (null filter = any) */
export function matches(s: SavedSearch, p: Property) {
  if (!p.published || p.type !== s.type) return false;
  if (s.district && p.district !== s.district) return false;
  if (s.minPrice != null && p.priceMillion < s.minPrice) return false;
  if (s.maxPrice != null && p.priceMillion > s.maxPrice) return false;
  if (s.minBeds != null && (p.bedrooms ?? -1) < s.minBeds) return false;
  if (s.keyword && !`${p.title} ${p.code} ${p.district}`.toLowerCase().includes(s.keyword.toLowerCase())) return false;
  return true;
}

const site = () => process.env.FRONTEND_URL ?? "http://localhost:3000";
const abs = (src: string) => (src.startsWith("http") ? src : `${site()}${src}`);

function listingEmail(p: Property) {
  const url = `${site()}/property/${encodeURIComponent(p.code)}`;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2D2D2D">
  <p style="color:#B08A4F;font-weight:bold;letter-spacing:2px;font-size:12px">NGUYỄN HỒNG TUẤN · ECOPARK</p>
  <h2 style="color:#2B2420;margin:4px 0 16px">Có căn mới đúng tiêu chí của bạn</h2>
  <a href="${url}" style="text-decoration:none;color:inherit">
    <img src="${esc(abs(p.images[0] ?? ""))}" alt="" width="560" style="width:100%;border-radius:6px">
    <h3 style="margin:14px 0 4px">${esc(p.title)}</h3>
  </a>
  <p style="margin:0;color:#B03A2E;font-size:18px;font-weight:bold">${esc(p.priceLabel)}</p>
  <p style="margin:6px 0 18px;color:#6E6257">Phân khu ${esc(p.district)} · ${p.areaM2} m²${p.bedrooms != null ? ` · ${p.bedrooms} PN` : ""}</p>
  <a href="${url}" style="background:#2B2420;color:#fff;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:13px">XEM CĂN</a>
  <p style="margin-top:28px;font-size:12px;color:#BFB3A3">Bạn nhận email này vì đã bật "Nhận thông báo căn mới". Tắt tại <a href="${site()}/account#alerts" style="color:#B08A4F">Tài khoản của tôi</a>.</p>
</div>`;
}

/**
 * After a listing is created/updated: email every member whose saved search it matches, once per (search, listing).
 * Runs in the background — a mail failure must never fail the admin's save.
 */
export async function notifyMatches(db: DataSource, p: Property) {
  if (!p.published) return;
  const searches = (await db.getRepository(SavedSearch).findBy({ type: p.type })).filter((s) => matches(s, p));
  if (!searches.length) return;
  // Only proven addresses: an unverified one may belong to someone who never asked for these emails.
  const users = new Map((await db.getRepository(User).findBy({ id: In(searches.map((s) => s.userId)), emailVerified: true })).map((u) => [u.id, u]));
  for (const s of searches) {
    const email = users.get(s.userId)?.email;
    if (!email) continue;
    // Claim the (search, listing) slot first: two saves racing can't both email; the loser's insert is ignored.
    const claimed = await db.createQueryBuilder().insert().into(SentAlert).values({ searchId: s.id, propertyCode: p.code }).orIgnore().returning("id").execute();
    if (!claimed.raw.length) continue;
    try {
      await sendMail(email, `Căn mới: ${p.title} – ${p.priceLabel}`, listingEmail(p));
    } catch (e) {
      await db.getRepository(SentAlert).delete({ searchId: s.id, propertyCode: p.code }); // let the next save retry
      console.error(`[notify] email to ${email} failed:`, e);
    }
  }
}
