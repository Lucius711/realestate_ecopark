import "reflect-metadata";
import { Module, RequestMethod, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ENTITIES } from "./entities";
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
 * The "editor" role was removed: such accounts become customers (they keep no admin access) before schema sync,
 * whose new role check would otherwise reject them. Safe to run every start; a no-op once done.
 */
// shortcut: one-off data migration run on every start; delete once production has started with this version.
export async function dropEditorRole() {
  const db = await new DataSource({ ...dbOptions, synchronize: false }).initialize();
  try {
    if ((await db.query(`SELECT to_regclass('users') AS t`))[0].t) await db.query(`UPDATE users SET role = 'member' WHERE role = 'editor'`);
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

async function bootstrap() {
  if (JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be set and at least 32 characters (see .env.example)");
  await dropEditorRole();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
