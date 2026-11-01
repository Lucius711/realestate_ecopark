import "reflect-metadata";
import { DataSource } from "typeorm";
import { dbOptions, dropEditorRole } from "./main";
import { Lead, Project, Property, Slide, Testimonial, User, Video } from "./entities";
import { hashPassword } from "./auth";
import { check, type Resource } from "./dto";
import { readFileSync } from "fs";
import { resolve } from "path";

const SEED = process.env.SEED_FILE ?? resolve(__dirname, "../../frontend/src/data/seed.json");
// `npm run seed:local`: extra test data (more listings, a 2nd project, reviews, leads, a customer account).
// Kept out of seed.json because the website falls back to seed.json when the API is down.
const LOCAL = process.argv.includes("--local");
const LOCAL_SEED = resolve(__dirname, "../seed.local.json");
const TABLES = ["properties", "projects", "slides", "videos", "testimonials", "leads"] as const;

/** Loads the same sample data the frontend falls back to. Upserts, so it is safe to re-run. */
async function run() {
  const s = JSON.parse(readFileSync(SEED, "utf8")) as Record<string, Record<string, unknown>[]>;
  if (LOCAL) {
    if (process.env.NODE_ENV === "production") throw new Error("seed:local is for local development only");
    const extra = JSON.parse(readFileSync(LOCAL_SEED, "utf8")) as Record<string, Record<string, unknown>[]>;
    for (const t of TABLES) s[t] = [...(s[t] ?? []), ...(extra[t] ?? [])];
  }
  // Same rules as the admin API, so bad sample data fails here instead of landing in the DB.
  for (const table of ["properties", "projects", "slides", "videos", "testimonials"] as Resource[])
    for (const [i, row] of (s[table] ?? []).entries()) {
      const { id: _id, ...fields } = row;
      await check(table, fields, false).catch((e) => {
        throw new Error(`seed ${table}[${i}] invalid: ${JSON.stringify(e.getResponse?.().message ?? e.message)}`);
      });
    }
  await dropEditorRole();
  const db = await new DataSource({ ...dbOptions, synchronize: true }).initialize();
  await db.getRepository(Property).save(s.properties as never);
  await db.getRepository(Project).save(s.projects as never);
  await db.getRepository(Slide).save(s.slides as never);
  await db.getRepository(Video).save(s.videos as never);
  await db.getRepository(Testimonial).save(s.testimonials as never);
  if (s.leads?.length) await db.getRepository(Lead).save(s.leads as never);
  for (const t of ["slides", "videos", "testimonials", "leads"]) await db.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), (SELECT COALESCE(MAX(id),1) FROM ${t}))`);
  // First admin. ADMIN_EMAIL is optional: set it to also allow "Tiếp tục với Google / Facebook" with that address.
  const username = process.env.ADMIN_USERNAME?.toLowerCase();
  const pw = process.env.ADMIN_PASSWORD;
  if (username && pw) {
    const users = db.getRepository(User);
    const email = process.env.ADMIN_EMAIL?.toLowerCase() || null;
    // An admin created by the older email-login version: give it this username instead of making a duplicate.
    const legacy = email ? await users.findOneBy({ email }) : null;
    const existing = await users.findOneBy({ username });
    if (existing) {
      // already there — never overwrite an existing password, so ADMIN_PASSWORD isn't used.
      // ADMIN_EMAIL comes from your own .env, so it counts as verified (Google sign-in for the first admin).
      if (email && existing.email === email && !existing.emailVerified) await users.update(existing.id, { emailVerified: true });
    } else if (pw.length < 10) {
      throw new Error("ADMIN_PASSWORD must be at least 10 characters (used only to create the first admin)");
    } else if (legacy && !legacy.username) {
      await users.save({ ...legacy, username, emailVerified: true, passwordHash: await hashPassword(pw), role: "admin" });
      console.log(`Added username "${username}" to admin ${email}`);
    } else {
      await users.save(users.create({ username, email, emailVerified: !!email, passwordHash: await hashPassword(pw), role: "admin" }));
      console.log(`Created admin "${username}"`);
    }
  }
  if (LOCAL) {
    const users = db.getRepository(User);
    if (!(await users.findOneBy({ username: "khach" })))
      await users.save(users.create({ username: "khach", passwordHash: await hashPassword("khach-pass-123"), role: "member", fullName: "Khách Dùng Thử", phone: "0900 000 123", email: "khach@example.com", emailVerified: true }));
    console.log("Local customer account: khach / khach-pass-123");
  }
  console.log("Seeded:", TABLES.map((k) => `${k}=${s[k]?.length ?? 0}`).join(" "));
  await db.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
