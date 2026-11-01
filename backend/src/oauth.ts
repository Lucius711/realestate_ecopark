import { Controller, Get, Param, Query, Req, Res } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import { Repository } from "typeorm";
import { User } from "./entities";
import { tokenPayload } from "./auth";

type Provider = "google" | "facebook";
const NAME: Record<string, string> = { google: "Google", facebook: "Facebook" };

const API_PUBLIC_URL = () => process.env.API_PUBLIC_URL ?? "http://localhost:4000";
const FRONTEND_URL = () => process.env.FRONTEND_URL ?? "http://localhost:3000";
// Register exactly this in Google Cloud / Facebook: {API_PUBLIC_URL}/login/oauth2/code/google (or /facebook). Served outside /api.
export const CALLBACK_PATH = "login/oauth2/code/:provider";
const redirectUri = (p: Provider) => `${API_PUBLIC_URL()}/login/oauth2/code/${p}`;

const PROVIDERS = {
  google: {
    id: () => process.env.GOOGLE_CLIENT_ID,
    secret: () => process.env.GOOGLE_CLIENT_SECRET,
    authorize: (id: string, state: string) =>
      `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: id, redirect_uri: redirectUri("google"), response_type: "code", scope: "openid email", state, prompt: "select_account" })}`,
    async email(code: string, id: string, secret: string) {
      const tok = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirectUri("google"), grant_type: "authorization_code" }),
      }).then((r) => r.json());
      if (!tok.access_token) return null;
      const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tok.access_token}` } }).then((r) => r.json());
      return info.email_verified ? (info.email as string) : null;
    },
  },
  facebook: {
    id: () => process.env.FACEBOOK_APP_ID,
    secret: () => process.env.FACEBOOK_APP_SECRET,
    authorize: (id: string, state: string) =>
      `https://www.facebook.com/v19.0/dialog/oauth?${new URLSearchParams({ client_id: id, redirect_uri: redirectUri("facebook"), response_type: "code", scope: "email", state })}`,
    async email(code: string, id: string, secret: string) {
      const tok = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({ client_id: id, client_secret: secret, redirect_uri: redirectUri("facebook"), code })}`).then((r) => r.json());
      if (!tok.access_token) return null;
      const info = await fetch(`https://graph.facebook.com/me?${new URLSearchParams({ fields: "email", access_token: tok.access_token })}`).then((r) => r.json());
      return (info.email as string | undefined) ?? null; // Facebook only returns confirmed emails
    },
  },
} as const;

/**
 * Which account a Google/Facebook sign-in lands in. Known email → that account, but only once its owner proved the
 * address. A member's unproven claim is dropped (the real owner gets their own account); an admin's unproven email
 * returns null — a typo in "add admin" must never hand admin rights to whoever owns that address.
 */
export async function oauthUser(users: Repository<User>, email: string): Promise<User | null> {
  const lower = email.toLowerCase();
  let user = await users.findOneBy({ email: lower });
  if (user && !user.emailVerified) {
    if (user.role !== "member") return null;
    await users.update(user.id, { email: null });
    user = null;
  }
  return user ?? users.save(users.create({ email: lower, emailVerified: true, username: null, passwordHash: null, role: "member" }));
}

const STATE_COOKIE = "oauth_state";

/**
 * "Tiếp tục với Google / Facebook": server-side authorization-code flow, no extra dependency.
 * Staff sign in with the email an admin attached to their account; any other email gets a member (customer) account.
 * The JWT goes back to the frontend in the URL fragment, which browsers never send to servers.
 */
@Controller()
export class OAuthController {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  private back(res: Response, params: Record<string, string>) {
    res.clearCookie(STATE_COOKIE, { path: "/" });
    return res.redirect(`${FRONTEND_URL()}/login#${new URLSearchParams(params)}`);
  }

  @Get("auth/oauth/:provider")
  start(@Param("provider") p: string, @Res() res: Response) {
    const prov = PROVIDERS[p as Provider];
    const id = prov?.id();
    if (!prov || !id) return this.back(res, { error: `Đăng nhập bằng ${NAME[p] ?? p} chưa được cấu hình` });
    const state = randomBytes(16).toString("hex");
    // CSRF guard: the callback must carry the same state this browser was given.
    res.cookie(STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: API_PUBLIC_URL().startsWith("https"), maxAge: 10 * 60 * 1000, path: "/" }); // "/" so the callback outside /api receives it
    return res.redirect(prov.authorize(id, state));
  }

  @Get(CALLBACK_PATH)
  async callback(@Param("provider") p: string, @Query("code") code: string, @Query("state") state: string, @Req() req: Request, @Res() res: Response) {
    const prov = PROVIDERS[p as Provider];
    const cookieState = /(?:^|;\s*)oauth_state=([a-f0-9]+)/.exec(req.headers.cookie ?? "")?.[1];
    if (!prov || !code || !state || state !== cookieState) return this.back(res, { error: "Phiên đăng nhập không hợp lệ, vui lòng thử lại" });

    let email: string | null = null;
    try {
      email = await prov.email(code, prov.id() ?? "", prov.secret() ?? "");
    } catch {
      /* provider unreachable — handled below */
    }
    if (!email) return this.back(res, { error: `Không lấy được email từ ${NAME[p] ?? p}` });

    const user = await oauthUser(this.users, email);
    if (!user) return this.back(res, { error: "Email này chưa được xác minh. Đăng nhập bằng mật khẩu và bấm link xác minh trong email trước." });

    return this.back(res, { token: await this.jwt.signAsync(tokenPayload(user)) });
  }
}
