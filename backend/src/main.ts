import "reflect-metadata";
import { Module, RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { District, ENTITIES, LivingCost } from "./entities";
import { PublicController } from "./public.controller";
import { AdminController } from "./admin.controller";
import { JwtModule } from "@nestjs/jwt";
import { AuthController, JwtGuard } from "./auth";
import { CALLBACK_PATH, OAuthController } from "./oauth";
import { CustomersController, MemberController } from "./member.controller";
import { UPLOAD_DIR, UploadsController } from "./uploads";
import type { NestExpressApplication } from "@nestjs/platform-express";

// Load backend/.env when present (Node >= 20.12); real env vars still win.
try {
  process.loadEnvFile();
} catch {
  /* no .env file */
}

export const dbOptions = {
  type: "postgres" as const,
  // DATABASE_URL (if set, e.g. on a host) wins over the separate DB_* values.
  url: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "ecopark",
  password: process.env.DB_PASSWORD ?? "ecopark",
  database: process.env.DB_NAME ?? "ecopark",
  // Supabase (and most hosted Postgres) requires TLS. Set DB_SSL=true there; local Postgres doesn't use it.
  // shortcut: certificate chain isn't verified; pin Supabase's CA (ssl.ca) if you need full verification.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  entities: ENTITIES,
  // shortcut: schema auto-sync is fine while the schema is young; switch to migrations before real data matters.
  synchronize: process.env.DB_SYNC !== "false",
};

const JWT_SECRET = process.env.JWT_SECRET ?? "";

/**
 * Data changes schema sync can't do on its own, run before it. Each step is a no-op once done, so it's safe every start.
 * - "editor" role removed → those accounts become customers (no admin access), or the new role check would reject them.
 * - Property published/verified/hasVideo checkboxes → status / verifiedAt (sync alone would drop the old columns' data).
 */
// shortcut: one-off data migrations run on every start; delete once production has started with this version.
export async function migrateLegacyData() {
  const db = await new DataSource({ ...dbOptions, synchronize: false }).initialize();
  try {
    const has = async (table: string, column?: string) =>
      column
        ? (await db.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, [table, column])).length > 0
        : Boolean((await db.query(`SELECT to_regclass($1) AS t`, [table]))[0].t);
    if (await has("users")) await db.query(`UPDATE users SET role = 'member' WHERE role = 'editor'`);
    if (await has("properties", "published")) {
      await db.transaction(async (t) => {
        await t.query(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'available', ADD COLUMN IF NOT EXISTS "verifiedAt" timestamptz`);
        await t.query(`UPDATE properties SET status = CASE WHEN published THEN 'available' ELSE 'draft' END, "verifiedAt" = CASE WHEN verified THEN "postedAt" END`);
        await t.query(`ALTER TABLE properties DROP COLUMN published, DROP COLUMN verified, DROP COLUMN IF EXISTS "hasVideo"`);
      });
      console.log("[migrate] properties: published/verified → status/verifiedAt");
    }
  } finally {
    await db.destroy();
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot(dbOptions),
    TypeOrmModule.forFeature(ENTITIES),
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "8h" } }),
  ],
  // Specific /admin/* controllers must come before AdminController, whose /admin/:resource would catch them.
  controllers: [PublicController, CustomersController, UploadsController, AdminController, AuthController, OAuthController, MemberController],
  providers: [JwtGuard],
})
class AppModule {}

const DEFAULT_DISTRICTS = ["Rừng Cọ", "Quận Đảo", "Giáo dục", "Sân Golf", "Sáng tạo", "Aquabay"];

/** First start: the 6 official phân khu. Every start: any name already used by a listing / building but missing from the list. */
export async function seedDistricts(db: DataSource) {
  const repo = db.getRepository(District);
  const have = new Set((await repo.find()).map((d) => d.name));
  const first = have.size === 0;
  const used = (await db.query(`SELECT district FROM properties UNION SELECT district FROM buildings`)) as { district: string }[];
  const want = [...(first ? DEFAULT_DISTRICTS : []), ...used.map((u) => u.district)].filter((n, i, a) => n && !have.has(n) && a.indexOf(n) === i);
  if (want.length) await repo.save(want.map((name) => repo.create({ name, sortOrder: (DEFAULT_DISTRICTS.indexOf(name) + 1 || DEFAULT_DISTRICTS.length + 1) * 10 })));
}

/** Market-typical figures, not official Ecopark prices: the admin corrects them in "Chi phí sinh hoạt". Only when the table is empty. */
const DEFAULT_COSTS: [string, string][] = [
  ["Điện", "Khoảng 3.500 – 4.000đ/kWh"],
  ["Nước", "Khoảng 20.000 – 25.000đ/m³"],
  ["Gửi xe máy", "Khoảng 100.000 – 150.000đ/tháng"],
  ["Gửi ô tô", "Khoảng 1.200.000 – 1.500.000đ/tháng"],
  ["Internet", "Khoảng 180.000 – 250.000đ/tháng"],
];

export async function seedCosts(db: DataSource) {
  const repo = db.getRepository(LivingCost);
  if (await repo.count()) return;
  await repo.save(DEFAULT_COSTS.map(([label, value], i) => repo.create({ label, value, sortOrder: (i + 1) * 10 })));
}

async function bootstrap() {
  if (JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be set and at least 32 characters (see .env.example)");
  await migrateLegacyData();
  if (process.env.NODE_ENV === "production" && !process.env.R2_PUBLIC_URL) console.warn("[uploads] R2 is not configured: uploads go to the container's ./uploads (docker volume). Set R2_* in .env.prod for a CDN.");
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  await seedDistricts(app.get(DataSource));
  await seedCosts(app.get(DataSource));
  app.disable("x-powered-by");
  const https = (process.env.API_PUBLIC_URL ?? "").startsWith("https");
  app.use((_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
    res.setHeader("X-Content-Type-Options", "nosniff"); // browsers must trust our Content-Type, never guess (matters for /uploads)
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (https) res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
    next();
  });
  // Local uploads (no R2 configured).
  if (!process.env.R2_PUBLIC_URL) app.useStaticAssets(UPLOAD_DIR, { prefix: "/uploads/" });
  // Behind a host's proxy every request arrives from the proxy's IP, so per-IP limits would hit all visitors at once.
  // TRUST_PROXY = number of proxies in front of the API (1 on Render/Railway/Fly). Leave unset locally: trusting
  // X-Forwarded-For without a proxy would let clients fake their IP and dodge the limits.
  if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));
  app.setGlobalPrefix("api", { exclude: [{ path: CALLBACK_PATH, method: RequestMethod.GET }] });
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",") });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  await app.listen(Number(process.env.PORT ?? 4000));
}

if (require.main === module) bootstrap();
