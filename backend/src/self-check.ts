// Smoke test against a running API: `npm run dev` (or start) in one shell, `npm test` in another.
import "reflect-metadata";
import assert from "assert";
import { DataSource } from "typeorm";

try {
  process.loadEnvFile(); // reuse ADMIN_EMAIL / ADMIN_PASSWORD from backend/.env
} catch {
  /* no .env */
}

const API = process.env.API_URL ?? "http://localhost:4000/api";
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

(async () => {
  const rent = await (await fetch(`${API}/properties?type=rent`)).json();
  assert(Array.isArray(rent) && rent.every((p: { type: string }) => p.type === "rent"), "type filter");
  assert.equal((await fetch(`${API}/properties/NOPE`)).status, 404);
  assert.equal((await fetch(`${API}/projects/eco-retreat`)).status, 200);
  assert.equal((await post("/leads", { name: "A", phone: "abc", source: "footer" })).status, 400, "bad phone rejected");
  assert.equal((await post("/leads", { name: "A", phone: "0912345678", source: "footer", isAdmin: true })).status, 400, "unknown field rejected");
  assert.equal((await post("/leads", { name: "Test", phone: "0912 345 678", email: "", source: "detail", propertyCode: "ECO-1801" })).status, 201);
  // --- OAuth callback lives outside /api (the URI registered with Google/Facebook) ---
  const ROOT = API.replace(/\/api$/, "");
  const cb = await fetch(`${ROOT}/login/oauth2/code/google?code=x&state=forged`, { redirect: "manual" });
  assert.equal(cb.status, 302, "callback route exists");
  assert(cb.headers.get("location")?.includes("/login#error="), "forged state rejected");
  assert.equal((await fetch(`${API}/login/oauth2/code/google`)).status, 404, "callback is not under /api");
  // --- auth ---
  const get = (path: string, token?: string) => fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  assert.equal((await get("/admin/leads")).status, 401, "admin needs a token");
  assert.equal((await get("/admin/leads", "not.a.jwt")).status, 401, "garbage token rejected");

  const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  assert(ADMIN_USERNAME && ADMIN_PASSWORD, "set ADMIN_USERNAME / ADMIN_PASSWORD and run `npm run seed` first");
  const login = async (username: string, password: string) => post("/auth/login", { username, password });

  const ok = await login(ADMIN_USERNAME, ADMIN_PASSWORD);
  assert.equal(ok.status, 200, "admin login");
  const admin = (await ok.json()).accessToken as string;
  assert.equal((await get("/admin/leads", admin)).status, 200, "admin reads leads");
  assert.equal((await get("/auth/me", admin)).status, 200);

  // the DB directly: a second admin for the role/lockout checks (admins are only made by promoting a customer in the UI)
  const { dbOptions } = await import("./main");
  const { oauthUser } = await import("./oauth");
  const { User } = await import("./entities");
  const { hashPassword } = await import("./auth");
  const db = await new DataSource({ ...dbOptions, synchronize: false }).initialize();
  const users = db.getRepository(User);
  const staffName = `staff${Date.now()}`;
  await users.save(users.create({ username: staffName, passwordHash: await hashPassword("staff-pass-123"), role: "admin" }));
  assert.equal((await post("/auth/users", { username: "x" + staffName, password: "staff-pass-123" }, { Authorization: `Bearer ${admin}` })).status, 404, "no 'create admin' endpoint any more");
  const staff = (await (await login(staffName, "staff-pass-123")).json()).accessToken as string;
  assert.equal((await (await get("/auth/me", staff)).json()).role, "admin", "new account is an admin");
  assert.equal((await get("/admin/leads", staff)).status, 200, "admin reads leads");
  assert.equal((await login(staffName.toUpperCase(), "staff-pass-123")).status, 200, "username is case-insensitive");

  // --- members: sign-up, profile, ♡, history, alerts ---
  const memberName = `member${Date.now()}`;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  assert.equal((await post("/auth/register", { username: "a", password: "short" })).status, 400, "register validates");
  assert.equal((await post("/auth/register", { username: memberName, password: "member-pass-1", role: "admin" })).status, 400, "can't pick a role");
  const reg = await post("/auth/register", { username: memberName, password: "member-pass-1", fullName: "Khách Test", phone: "0912 000 111" });
  assert.equal(reg.status, 201, "register");
  const member = (await reg.json()).accessToken as string;
  assert.equal((await post("/auth/register", { username: memberName, password: "member-pass-1" })).status, 409, "duplicate username");
  const me = await (await get("/auth/me", member)).json();
  assert.equal(me.fullName, "Khách Test", "profile in /auth/me");
  assert.equal((await get("/admin/slides", member)).status, 403, "member blocked from admin API");
  assert.equal((await get("/admin/customers", member)).status, 403);
  const put = (path: string, body: unknown, t: string) => fetch(API + path, { method: "PUT", headers: { "Content-Type": "application/json", ...auth(t) }, body: JSON.stringify(body) });
  const del = (path: string, t: string) => fetch(API + path, { method: "DELETE", headers: auth(t) });
  // alerts need an email
  assert.equal((await post("/me/searches", { type: "rent" }, auth(member))).status, 400, "alert needs email");
  assert.equal((await put("/me/profile", { email: "bad" }, member)).status, 400);
  assert.equal((await put("/me/profile", { email: `${memberName}@example.com` }, member)).status, 200);
  assert.equal((await (await get("/auth/me", member)).json()).emailVerified, false, "typed email starts unverified");
  assert.equal((await post("/me/searches", { type: "rent", minPrice: 50, maxPrice: 10 }, auth(member))).status, 400, "min > max");
  const search = await post("/me/searches", { type: "rent", district: "Quận Đảo", minBeds: 3, keyword: "alert" }, auth(member));
  assert.equal(search.status, 201);
  // ♡
  assert.equal((await post("/me/favorites/ECO-1801", {}, auth(member))).status, 201);
  assert.equal((await post("/me/favorites/ECO-1801", {}, auth(member))).status, 201, "saving twice is fine");
  assert.equal((await post("/me/favorites/NOPE-1", {}, auth(member))).status, 404);
  const favs = await (await get("/me/favorites", member)).json();
  assert.deepEqual(favs.map((p: { code: string }) => p.code), ["ECO-1801"]);
  // request history: a form sent while signed in shows up for that member only
  assert.equal((await post("/leads", { name: "Khách Test", phone: "0912000111", source: "detail", propertyCode: "ECO-1801" }, auth(member))).status, 201);
  const mine = await (await get("/me/leads", member)).json();
  assert.equal(mine.length, 1, "lead linked to member");
  assert.equal(mine[0].status, "new");
  assert.equal(mine[0].phone, undefined, "history doesn't echo contact details");

  assert.equal((await get("/auth/users", admin)).status, 200, "admin lists accounts");
  assert.equal((await get("/auth/users", member)).status, 403, "member can't list accounts");

  // --- validation on admin writes ---
  const fs = await import("fs");
  const outbox = new URL("../mail-outbox/", `file://${__dirname}/`);
  const mineOut = () => (fs.existsSync(outbox) ? fs.readdirSync(outbox).filter((f) => f.includes(memberName)).length : 0); // other test accounts may match too
  const readMail = (f: string) => fs.readFileSync(new URL(f, outbox), "utf8");
  const listing = (code: string, extra: Record<string, unknown> = {}) => fetch(API + "/admin/properties", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin}` }, body: JSON.stringify({ ...extra, code, type: "rent", title: "Căn alert test", priceLabel: "30 triệu/tháng", priceMillion: 30, district: "Quận Đảo", bedrooms: 4, bathrooms: 3, areaM2: 200, images: ["/images/aerial-park.webp"] }) });
  if (!process.env.RESEND_API_KEY) {
    // unverified address: no alerts
    const n0 = mineOut();
    const early = `ALERT-U${Date.now() % 100000}`;
    assert.equal((await listing(early)).status, 201);
    await new Promise((r) => setTimeout(r, 800));
    assert.equal(mineOut(), n0, "no alerts to an unverified email");
    await fetch(API + `/admin/properties/${early}`, { method: "DELETE", headers: { Authorization: `Bearer ${admin}` } });
    // the emailed link verifies it (and a tampered one doesn't)
    const mail = fs.readdirSync(outbox).filter((f) => f.includes(memberName)).map(readMail).find((h) => h.includes("verify-email?token="));
    assert(mail, "verification email sent");
    const mails = mineOut();
    assert.equal((await put("/me/profile", { fullName: "Khách Test 2" }, member)).status, 200);
    assert.equal(mineOut(), mails, "editing the name doesn't re-send the verification email");
    const link = /href="([^"]*verify-email\?token=[^"]+)"/.exec(mail)![1];
    const bad = await fetch(link.slice(0, -4) + "AAAA", { redirect: "manual" });
    assert(bad.headers.get("location")?.includes("email=invalid"), "tampered link rejected");
    assert.equal((await get(`/me/favorites`, new URL(link).searchParams.get("token")!)).status, 401, "email link is not a login token");
    const okLink = await fetch(link, { redirect: "manual" });
    assert(okLink.headers.get("location")?.includes("email=verified"), "link verifies");
    assert.equal((await (await get("/auth/me", member)).json()).emailVerified, true);
  }
  const before = mineOut();
  const alertCode = `ALERT-${Date.now() % 100000}`;
  const created = await listing(alertCode);
  assert.equal(created.status, 201);
  await new Promise((r) => setTimeout(r, 800));
  if (!process.env.RESEND_API_KEY) assert.equal(mineOut(), before + 1, "matching listing emailed (local outbox)");
  await fetch(API + `/admin/properties/${alertCode}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin}` }, body: JSON.stringify({ priceLabel: "31 triệu/tháng" }) });
  await new Promise((r) => setTimeout(r, 500));
  if (!process.env.RESEND_API_KEY) assert.equal(mineOut(), before + 1, "no repeat email on edit");
  await fetch(API + `/admin/properties/${alertCode}`, { method: "DELETE", headers: { Authorization: `Bearer ${admin}` } });
  if (!process.env.RESEND_API_KEY) {
    const n1 = mineOut();
    const dep = `DEP-${Date.now() % 100000}`;
    await listing(dep, { status: "deposit" });
    await new Promise((r) => setTimeout(r, 800));
    assert.equal(mineOut(), n1, "a deposit listing sends no alert");
    await fetch(API + `/admin/properties/${dep}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin}` }, body: JSON.stringify({ status: "available" }) });
    await new Promise((r) => setTimeout(r, 800));
    assert.equal(mineOut(), n1 + 1, "switching it to available sends it");
    await fetch(API + `/admin/properties/${dep}`, { method: "DELETE", headers: { Authorization: `Bearer ${admin}` } });
  }
  const customers = await (await get("/admin/customers", admin)).json();
  const target = customers.find((c: { username: string }) => c.username === memberName);
  assert.equal((await post(`/admin/customers/${target.id}/promote`, {}, auth(member))).status, 403, "a member can't promote anyone");
  assert(customers.some((c: { username: string; favorites: string[] }) => c.username === memberName && c.favorites.includes("ECO-1801")), "admin sees member's saved listings");

  // --- uploads ---
  const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000" + "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082", "hex");
  const up = (bytes: Buffer, type: string, t: string) => {
    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array(bytes)], { type }), "x");
    return fetch(API + "/admin/uploads", { method: "POST", headers: { Authorization: `Bearer ${t}` }, body: fd });
  };
  assert.equal((await up(png, "image/png", member)).status, 403, "members can't upload");
  assert.equal((await up(Buffer.from("<script>alert(1)</script>"), "image/png", admin)).status, 400, "fake image rejected");
  const upRes = await up(png, "image/png", admin);
  assert.equal(upRes.status, 201, "upload");
  const { url } = await upRes.json();
  assert.equal((await fetch(url)).status, 200, "uploaded file is served");
  assert.equal((await put("/admin/slides/1", { image: url }, admin)).status, 200, "uploaded URL accepted as image");
  assert.equal((await put("/admin/slides/1", { image: "https://evil.example/x.png" }, admin)).status, 400, "foreign image URL rejected");
  await put("/admin/slides/1", { image: "/images/aerial-park.webp" }, admin);

  const A = { Authorization: `Bearer ${admin}` };
  const send = (method: string, path: string, body: unknown) => fetch(API + path, { method, headers: { "Content-Type": "application/json", ...A }, body: JSON.stringify(body) });
  const good = { code: "TEST-0001", type: "rent", title: "Căn test validation", priceLabel: "9 triệu/tháng", priceMillion: 9, district: "Quận Đảo", bedrooms: 2, bathrooms: 2, areaM2: 70, images: ["/images/aerial-park.webp"] };
  await send("DELETE", "/admin/properties/TEST-0001", {});
  const bad = await send("POST", "/admin/properties", { ...good, type: "villa", priceMillion: -1, images: ["https://evil.example/x.jpg"], isAdmin: true });
  assert.equal(bad.status, 400, "invalid property rejected");
  const msgs = JSON.stringify((await bad.json()).message);
  for (const f of ["type", "priceMillion", "images", "isAdmin"]) assert(msgs.includes(f), `error mentions ${f}: ${msgs}`);
  assert.equal((await send("POST", "/admin/properties", { ...good, title: undefined })).status, 400, "missing required field");
  assert.equal((await send("POST", "/admin/properties", good)).status, 201, "valid property created");
  assert.equal((await send("POST", "/admin/properties", good)).status, 400, "duplicate code");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { priceLabel: "10 triệu/tháng", priceMillion: 10 })).status, 200, "partial update");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { title: null })).status, 400, "null can't blank a required field");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { bedrooms: null })).status, 200, "nullable field can be cleared");
  // listing status: what the public site shows for each state
  const pub = async () => (await get("/properties/TEST-0001")).status;
  const listed = async () => ((await (await get("/properties?type=rent")).json()) as { code: string }[]).some((p) => p.code === "TEST-0001");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { status: "draft" })).status, 200);
  assert.deepEqual([await pub(), await listed()], [404, false], "draft: nowhere");
  await send("PUT", "/admin/properties/TEST-0001", { status: "deposit" });
  assert.deepEqual([await pub(), await listed()], [200, true], "deposit: still listed");
  await send("PUT", "/admin/properties/TEST-0001", { status: "sold" });
  assert.deepEqual([await pub(), await listed()], [200, false], "sold: page stays, off the lists");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { status: "gone" })).status, 400, "status enum");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { videoUrl: "https://evil.example/v" })).status, 400, "video link must be TikTok/YouTube");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { videoUrl: "https://www.youtube.com/watch?v=abcdefghijk", verifiedAt: new Date().toISOString(), pinned: true })).status, 200);
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { verifiedAt: null, videoUrl: null })).status, 200, "clearing optional fields");
  // chi phí sinh hoạt: edited in admin, read by the public page
  const cost = (await (await send("POST", "/admin/costs", { label: "TEST-CP", value: "1.000đ", sortOrder: 999 })).json()) as { id: number };
  assert.equal((await send("POST", "/admin/costs", { label: "  ", value: "x" })).status, 400, "cost label required");
  assert.deepEqual(((await (await get("/costs")).json()) as { label: string; value: string }[]).at(-1), { label: "TEST-CP", value: "1.000đ" }, "public list, by sortOrder");
  assert.equal((await send("PUT", `/admin/costs/${cost.id}`, { value: "2.000đ" })).status, 200);
  assert.equal(((await (await get("/costs")).json()) as { value: string }[]).at(-1)?.value, "2.000đ", "edit reaches the public page");
  assert.equal((await send("DELETE", `/admin/costs/${cost.id}`, {})).status, 200, "delete");
  // phân khu: a managed list; renaming cascades, deleting a used one is refused
  const dsList = async () => (await (await get("/districts")).json()) as { id: number; name: string }[];
  assert((await dsList()).map((d) => d.name).includes("Quận Đảo"), "default phân khu are seeded");
  assert.equal((await send("POST", "/admin/districts", { name: "Quận Đảo" })).status, 400, "phân khu name is unique");
  const nd = (await (await send("POST", "/admin/districts", { name: "TEST-KHU", sortOrder: 5 })).json()) as { id: number };
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { district: "Không có khu này" })).status, 400, "listing needs a listed phân khu");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { district: "TEST-KHU" })).status, 200);
  assert.equal((await send("DELETE", `/admin/districts/${nd.id}`, {})).status, 400, "a phân khu in use can't be deleted");
  assert.equal((await send("PUT", `/admin/districts/${nd.id}`, { name: "TEST-KHU-2" })).status, 200, "rename");
  assert.equal(((await (await get("/properties/TEST-0001")).json()) as { district: string }).district, "TEST-KHU-2", "rename reaches listings");
  assert.equal((await send("PUT", `/admin/districts/${nd.id}`, { name: "Aquabay" })).status, 400, "rename onto an existing name");
  await send("PUT", "/admin/properties/TEST-0001", { district: "Quận Đảo" });
  assert.equal((await send("DELETE", `/admin/districts/${nd.id}`, {})).status, 200, "unused phân khu can be deleted");
  // buildings (tòa): public listings carry the building + its management fee; deleting a building keeps its listings
  const bld = await send("POST", "/admin/buildings", { name: "TEST-S1", district: "Aquabay", managementFee: 12000 });
  assert.equal(bld.status, 201, "building created");
  const bldId = ((await bld.json()) as { id: number }).id;
  assert.equal((await send("POST", "/admin/buildings", { name: "TEST-S1", district: "Aquabay", managementFee: null })).status, 400, "building name is unique");
  assert.equal((await send("POST", "/admin/buildings", { name: "TEST-S2", district: "Aquabay", managementFee: -1 })).status, 400, "fee can't be negative");
  assert.equal((await send("PUT", "/admin/properties/TEST-0001", { buildingId: bldId })).status, 200, "listing points at a building");
  const withB = (await (await get("/properties/TEST-0001")).json()) as { building: { name: string; managementFee: number } };
  assert.deepEqual([withB.building.name, withB.building.managementFee], ["TEST-S1", 12000], "detail carries its building");
  assert.equal((await send("DELETE", `/admin/buildings/${bldId}`, {})).status, 200);
  assert.equal(((await (await get("/properties/TEST-0001")).json()) as { building: unknown }).building, null, "listing survives its building");
  assert.equal((await send("DELETE", "/admin/properties/TEST-0001", {})).status, 200);
  const overviewBefore = (await (await get("/projects/eco-retreat")).json()).overviewImage;
  assert.equal((await send("PUT", "/admin/projects/eco-retreat", { overviewImage: "" })).status, 200, "optional overview image can be left empty");
  await send("PUT", "/admin/projects/eco-retreat", { overviewImage: overviewBefore });
  assert.equal((await send("PUT", "/admin/projects/eco-retreat", { overviewImage: "https://evil.example/x.png" })).status, 400, "but not a foreign URL");
  const nested = await send("PUT", "/admin/projects/eco-retreat", { policies: [{ title: "", detail: "x" }] });
  assert.equal(nested.status, 400, "nested policy validated");
  assert(JSON.stringify((await nested.json()).message).includes("policies.0.title"));
  assert.equal((await send("PUT", "/admin/testimonials/1", { rating: 6 })).status, 400, "rating 1-5");
  assert.equal((await send("PUT", "/admin/videos/1", { url: "https://evil.example/v" })).status, 400, "video url must be tiktok/youtube");
  assert.equal((await send("PUT", "/admin/slides/1", { link: "javascript:alert(1)" })).status, 400, "slide link safe");
  assert.equal((await send("POST", "/admin/leads", { name: "x" })).status, 405, "leads not created by hand");
  const leadId = ((await (await get("/admin/leads", admin)).json()) as { id: number }[])[0]?.id;
  assert(leadId, "need at least one lead (run seed:local or submit a form)");
  assert.equal((await send("PUT", `/admin/leads/${leadId}`, { status: "won" })).status, 400, "lead status enum");
  assert.equal((await send("PUT", `/admin/leads/${leadId}`, { phone: "000" })).status, 400, "lead contact details read-only");
  assert.equal((await post("/leads", { name: "   ", phone: "0912345678", source: "footer" })).status, 400, "blank name rejected");
  assert.equal((await post("/leads", { name: "A", phone: "1-2-3-4-5-6-7", source: "footer" })).status, 400, "phone needs 8+ digits");

  // --- checks that need the DB directly ---
  // a demoted account loses access at once, even with a still-valid token
  await users.update({ username: staffName.toLowerCase() }, { role: "member" });
  assert.equal((await get("/admin/slides", staff)).status, 403, "demoted admin's token loses admin access");
  // OAuth: someone typed a victim's email into their own profile without proving it…
  const victim = `victim${Date.now()}@example.com`;
  const squatter = `squat${Date.now()}`;
  const sq = (await (await post("/auth/register", { username: squatter, password: "squat-pass-1", email: victim })).json()).user;
  const landed = (await oauthUser(users, victim))!;
  assert.notEqual(landed.id, sq.id, "Google sign-in never lands in the account that only typed the email");
  assert.equal((await users.findOneBy({ id: sq.id }))!.email, null, "unproven claim removed");
  // "Cấp quyền quản trị": admin promotes a customer; promoting twice is a 404 (no longer a customer)
  assert.equal((await post(`/admin/customers/${sq.id}/promote`, {}, { Authorization: `Bearer ${admin}` })).status, 201, "promote customer");
  const sqToken = (await (await login(squatter, "squat-pass-1")).json()).accessToken as string;
  assert.equal((await get("/admin/leads", sqToken)).status, 200, "promoted account is an admin");
  assert.equal((await post(`/admin/customers/${sq.id}/promote`, {}, { Authorization: `Bearer ${admin}` })).status, 404, "only customers can be promoted");
  await users.update(sq.id, { role: "member" });
  assert.equal(landed.emailVerified, true);
  assert.equal((await oauthUser(users, victim.toUpperCase()))!.id, landed.id, "next sign-in → same account");
  // an admin whose email isn't proven (e.g. a promoted customer who typed it) can't be opened with Google
  const typo = `typo${Date.now()}@example.com`;
  const typoName = `typo${Date.now()}`;
  await users.save(users.create({ username: typoName, email: typo, emailVerified: false, passwordHash: await hashPassword("typo-pass-1234"), role: "admin" }));
  assert.equal(await oauthUser(users, typo), null, "unverified admin email can't sign in with Google");
  assert.equal((await users.findOneBy({ username: typoName }))!.email, typo, "and the admin keeps the email (can still verify it)");
  // old-format password hashes still log in, and are upgraded to the current cost
  const { scryptSync, randomBytes } = await import("crypto");
  const salt = randomBytes(16);
  await users.update({ username: staffName.toLowerCase() }, { passwordHash: `scrypt$${salt.toString("hex")}$${scryptSync("staff-pass-123", salt, 64).toString("hex")}` });
  assert.equal((await login(staffName, "staff-pass-123")).status, 200, "legacy hash logs in");
  assert((await users.findOneBy({ username: staffName.toLowerCase() }))!.passwordHash!.startsWith("scrypt$32768,8,3$"), "legacy hash upgraded");
  await db.destroy();

  // lockout after 5 wrong passwords
  for (let i = 0; i < 5; i++) assert.equal((await login(staffName, "wrong-password")).status, 401);
  assert.equal((await login(staffName, "staff-pass-123")).status, 429, "locked after 5 failures");
  // per-IP login limit: checked on the limiter itself, so this run doesn't lock the local IP out for 15 minutes
  const { SlidingWindow } = await import("./rate-limit");
  const w = new SlidingWindow<string>(3, 60_000);
  for (let i = 0; i < 3; i++) { assert(!w.full("ip"), "under the limit"); w.hit("ip"); }
  assert(w.full("ip") && !w.full("other-ip"), "full after 3, per key");
  console.log("self-check ok");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
