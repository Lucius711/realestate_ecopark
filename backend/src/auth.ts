import {
  Body,
  CanActivate,
  ConflictException,
  Controller,
  ExecutionContext,
  Get,
  HttpCode,
  HttpException,
  Ip,
  Injectable,
  Post,
  Query,
  Req,
  Res,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { IsEmail, IsOptional, IsString, Length, Matches } from "class-validator";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Repository } from "typeorm";
import type { Response } from "express";
import { sendMail } from "./mailer";
import { SlidingWindow } from "./rate-limit";
import { User, type Role } from "./entities";

type ScryptCost = { N: number; r: number; p: number };
const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: ScryptCost & { maxmem: number }) => Promise<Buffer>;
const derive = (pw: string, salt: Buffer, c: ScryptCost) => scryptAsync(pw, salt, 64, { ...c, maxmem: 128 * c.N * c.r * 2 });

// OWASP minimum for scrypt (N=2^15, r=8, p=3): ~32 MiB per hash, fits small hosts.
const COST: ScryptCost = { N: 2 ** 15, r: 8, p: 3 };
const LEGACY: ScryptCost = { N: 2 ** 14, r: 8, p: 1 }; // node's default, used by hashes without a cost field

/** "scrypt$N,r,p$<salt hex>$<hash hex>" — node's built-in scrypt, no native bcrypt build needed on Windows. */
export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${COST.N},${COST.r},${COST.p}$${salt.toString("hex")}$${(await derive(pw, salt, COST)).toString("hex")}`;
}

function parseHash(stored: string | null) {
  const parts = (stored ?? "").split("$");
  if (parts[0] !== "scrypt") return null;
  if (parts.length === 3) return { cost: LEGACY, salt: parts[1], hash: parts[2] };
  const [N, r, p] = (parts[1] ?? "").split(",").map(Number);
  if (parts.length !== 4 || ![N, r, p].every((n) => Number.isInteger(n) && n > 0) || N > 2 ** 20) return null;
  return { cost: { N, r, p }, salt: parts[2], hash: parts[3] };
}

export async function verifyPassword(pw: string, stored: string | null) {
  const h = parseHash(stored);
  if (!h?.salt || !h.hash) return false;
  const got = await derive(pw, Buffer.from(h.salt, "hex"), h.cost);
  const want = Buffer.from(h.hash, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Old hashes get the current cost on the next successful login. */
export const needsRehash = (stored: string | null) => {
  const c = parseHash(stored)?.cost;
  return !c || c.N !== COST.N || c.r !== COST.r || c.p !== COST.p;
};

// Hashed once at startup so an unknown username costs the same time as a wrong password (no username probing by timing).
const DUMMY_HASH = hashPassword(randomBytes(16).toString("hex"));

export interface JwtUser {
  sub: number;
  username: string | null;
  /** Accounts made through Google / Facebook may have only an email. */
  email: string | null;
  role: Role;
}

export const tokenPayload = (u: User): JwtUser => ({ sub: u.id, username: u.username, email: u.email, role: u.role });

const USERNAME = /^[a-zA-Z0-9._-]{3,32}$/;

/** Endpoints guarded by JwtGuard may restrict further with @Roles("admin"). No @Roles = any logged-in user. */
export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const token = /^Bearer (.+)$/.exec(String(req.headers.authorization ?? ""))?.[1];
    if (!token) throw new UnauthorizedException();
    let sub: number;
    try {
      sub = (await this.jwt.verifyAsync<JwtUser>(token)).sub;
    } catch {
      throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
    }
    // Role comes from the DB, not the token: a demoted or deleted account loses access at once.
    const user = await this.users.findOneBy({ id: sub });
    if (!user) throw new UnauthorizedException("Tài khoản không còn tồn tại");
    req.user = tokenPayload(user);
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>("roles", [ctx.getHandler(), ctx.getClass()]);
    if (roles && !roles.includes(req.user.role)) throw new ForbiddenException();
    return true;
  }
}

export class LoginDto {
  @IsString() @Length(1, 64) username: string;
  @IsString() @Length(1, 200) password: string;
}

export class CreateUserDto {
  @Matches(USERNAME, { message: "Tên đăng nhập 3–32 ký tự, chỉ gồm chữ, số, . _ -" }) username: string;
  /** Optional: lets this account also use "Tiếp tục với Google / Facebook". */
  @IsOptional() @IsEmail({}, { message: "Email không hợp lệ" }) @Length(0, 120) email?: string;
  @IsString() @Length(10, 200) password: string;
}

const PHONE = /^(?=(?:\D*\d){8,15}\D*$)[0-9 +().-]{8,20}$/;

/** Public sign-up: always creates a member (customer) account; staff accounts come only from POST /auth/users. */
export class RegisterDto {
  @Matches(USERNAME, { message: "Tên đăng nhập 3–32 ký tự, chỉ gồm chữ, số, . _ -" }) username: string;
  @IsString() @Length(8, 200, { message: "Mật khẩu tối thiểu 8 ký tự" }) password: string;
  @IsOptional() @IsString() @Length(0, 80) fullName?: string;
  @IsOptional() @Matches(PHONE, { message: "Số điện thoại không hợp lệ" }) phone?: string;
  @IsOptional() @IsEmail({}, { message: "Email không hợp lệ" }) @Length(0, 120) email?: string;
}

// Per IP; add a captcha if bots show up.
const signupLimit = new SlidingWindow<string>(5, 60 * 60 * 1000);

/** What the site gets about the signed-in user (profile included, to pre-fill forms). */
export const profileOf = (u: User) => ({ id: u.id, username: u.username, email: u.email, emailVerified: u.emailVerified, role: u.role, fullName: u.fullName, phone: u.phone });

// Email links are signed with their own key, so a link can never be used as a login token (and vice versa).
const verifyKey = () => `${process.env.JWT_SECRET}:verify-email`;
// Per account: caps how many links one account can send to addresses it may not own.
const verifyLimit = new SlidingWindow<number>(3, 60 * 60 * 1000);

/** Emails a 24h link proving the user owns `user.email`. Throws 429 past 3 links/hour per account. */
export async function sendVerifyEmail(jwt: JwtService, user: User) {
  if (!user.email || user.emailVerified) return;
  if (verifyLimit.full(user.id)) throw new HttpException("Đã gửi nhiều email xác minh, vui lòng thử lại sau", 429);
  verifyLimit.hit(user.id);
  const t = await jwt.signAsync({ sub: user.id, email: user.email }, { secret: verifyKey(), expiresIn: "24h" });
  const api = (process.env.API_PUBLIC_URL ?? "http://localhost:4000").replace(/\/$/, "");
  const url = `${api}/api/auth/verify-email?token=${encodeURIComponent(t)}`;
  await sendMail(
    user.email,
    "Xác minh email – Nguyễn Hồng Tuấn Ecopark",
    `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2D2D2D"><h2 style="color:#2B2420">Xác minh email của bạn</h2><p>Bấm nút dưới đây để xác nhận đây là email của bạn và bắt đầu nhận thông báo căn mới.</p><p><a href="${url}" style="background:#2B2420;color:#fff;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:13px">XÁC MINH EMAIL</a></p><p style="font-size:12px;color:#8A7F74">Link có hiệu lực 24 giờ. Nếu bạn không tạo tài khoản, hãy bỏ qua email này.</p></div>`,
  );
}

// shortcut: in-memory lockout resets on restart and is per-process; move to Redis if the API runs on several instances.
const failures = new Map<string, { count: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
// Per IP, failures only: stops one machine trying a common password across many usernames (the per-username lock can't).
const loginIpLimit = new SlidingWindow<string>(20, LOCK_MS);

@Controller("auth")
export class AuthController {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Ip() ip: string) {
    const username = dto.username.trim().toLowerCase();
    // Per username + IP: a stranger failing on "tuan" can't lock the real admin out from their own network.
    const lockKey = `${username}|${ip}`;
    const f = failures.get(lockKey);
    if ((f && f.count >= MAX_FAILS && f.until > Date.now()) || loginIpLimit.full(ip)) throw new HttpException("Đăng nhập sai quá nhiều lần, thử lại sau 15 phút", 429);

    const user = await this.users.findOneBy({ username });
    const ok = await verifyPassword(dto.password, user?.passwordHash ?? (await DUMMY_HASH));
    if (!user || !ok) {
      const next = f && f.until > Date.now() ? f.count + 1 : 1;
      failures.set(lockKey, { count: next, until: Date.now() + LOCK_MS });
      loginIpLimit.hit(ip);
      throw new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu");
    }
    failures.delete(lockKey);
    if (needsRehash(user.passwordHash)) await this.users.update(user.id, { passwordHash: await hashPassword(dto.password) });
    return { accessToken: await this.jwt.signAsync(tokenPayload(user)), user: profileOf(user) };
  }

  @Post("register")
  async register(@Body() dto: RegisterDto, @Ip() ip: string) {
    if (signupLimit.full(ip)) throw new HttpException("Bạn tạo quá nhiều tài khoản, vui lòng thử lại sau", 429);
    const username = dto.username.toLowerCase();
    const email = dto.email ? dto.email.toLowerCase() : null;
    if (await this.users.findOneBy({ username })) throw new ConflictException("Tên đăng nhập đã có người dùng");
    if (email && (await this.users.findOneBy({ email }))) throw new ConflictException("Email đã được dùng cho tài khoản khác");
    signupLimit.hit(ip); // after the conflict checks: a taken username doesn't use up the quota
    const user = await this.users.save(
      this.users.create({ username, email, passwordHash: await hashPassword(dto.password), role: "member", fullName: dto.fullName?.trim() || null, phone: dto.phone?.trim() || null }),
    );
    // A failed link email must not fail sign-up; the member can resend it from /account.
    await sendVerifyEmail(this.jwt, user).catch((e) => console.error("[verify-email]", e));
    return { accessToken: await this.jwt.signAsync(tokenPayload(user)), user: profileOf(user) };
  }

  /** The link from the verification email. Only verifies the address the link was sent to (a later email change voids it). */
  @Get("verify-email")
  async verifyEmail(@Query("token") t: string, @Res() res: Response) {
    const back = (status: string) => res.redirect(`${(process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "")}/account?email=${status}#profile`);
    const p = await this.jwt.verifyAsync<{ sub: number; email: string }>(String(t ?? ""), { secret: verifyKey() }).catch(() => null);
    const user = p && (await this.users.findOneBy({ id: p.sub }));
    if (!user || user.email !== p.email) return back("invalid");
    if (!user.emailVerified) await this.users.update(user.id, { emailVerified: true });
    return back("verified");
  }

  /** Read from the DB (not just the token) so profile edits and deleted accounts take effect at once. */
  @Get("me")
  @UseGuards(JwtGuard)
  async me(@Req() req: { user: JwtUser }) {
    const user = await this.users.findOneBy({ id: req.user.sub });
    if (!user) throw new UnauthorizedException();
    return profileOf(user);
  }

  @Get("users")
  @UseGuards(JwtGuard)
  @Roles("admin")
  async listUsers() {
    const users = await this.users.find({ order: { id: "ASC" } });
    return users.map((u) => ({ ...profileOf(u), createdAt: u.createdAt }));
  }

  /** Admin adds another admin account. */
  @Post("users")
  @UseGuards(JwtGuard)
  @Roles("admin")
  async createUser(@Body() dto: CreateUserDto) {
    const username = dto.username.toLowerCase();
    const email = dto.email?.toLowerCase() ?? null;
    if (await this.users.findOneBy({ username })) throw new ConflictException("Tên đăng nhập đã tồn tại");
    if (email && (await this.users.findOneBy({ email }))) throw new ConflictException("Email đã gắn với tài khoản khác");
    // The email only enables Google/Facebook sign-in once its owner clicks the link we send (guards against typos).
    const u = await this.users.save(this.users.create({ username, email, emailVerified: false, passwordHash: await hashPassword(dto.password), role: "admin" }));
    await sendVerifyEmail(this.jwt, u).catch((e) => console.error("[verify-email]", e));
    return { id: u.id, username: u.username, email: u.email, role: u.role };
  }
}
