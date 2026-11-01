import { BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Req, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Max, Min, ValidateIf } from "class-validator";
import { DataSource, In, Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { JwtGuard, Roles, profileOf, sendVerifyEmail, type JwtUser } from "./auth";
import { Favorite, LISTED, Lead, PUBLIC, Property, SavedSearch, User } from "./entities";
import { PROPERTY_TYPES } from "./dto";

type Req = { user: JwtUser };

export class ProfileDto {
  @IsOptional() @IsString() @Length(0, 80) fullName?: string;
  @ValidateIf((o) => !!o.phone) @Matches(/^(?=(?:\D*\d){8,15}\D*$)[0-9 +().-]{8,20}$/, { message: "Số điện thoại không hợp lệ" }) phone?: string;
  @ValidateIf((o) => !!o.email) @IsEmail({}, { message: "Email không hợp lệ" }) @Length(0, 120) email?: string;
}

export class SavedSearchDto {
  @IsIn(PROPERTY_TYPES) type: (typeof PROPERTY_TYPES)[number];
  @IsOptional() @IsString() @Length(1, 50) district?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1_000_000) minPrice?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1_000_000) maxPrice?: number;
  @IsOptional() @IsInt() @Min(0) @Max(20) minBeds?: number;
  @IsOptional() @IsString() @Length(1, 60) keyword?: string;
}

const MAX_SEARCHES = 10;

/** Everything a signed-in user (member or staff) does for themselves: profile, ♡ saved listings, request history, new-listing alerts. */
@Controller("me")
@UseGuards(JwtGuard)
export class MemberController {
  constructor(
    private db: DataSource,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Favorite) private favs: Repository<Favorite>,
    @InjectRepository(SavedSearch) private searches: Repository<SavedSearch>,
    private jwt: JwtService,
  ) {}

  @Put("profile")
  async updateProfile(@Req() req: Req, @Body() dto: ProfileDto) {
    const user = await this.users.findOneBy({ id: req.user.sub });
    if (!user) throw new NotFoundException();
    let emailChanged = false;
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase() || null;
      if (email && email !== user.email && (await this.users.findOneBy({ email }))) throw new ConflictException("Email đã được dùng cho tài khoản khác");
      // Staff sign in with Google/Facebook through this email — don't let a typo here lock them out.
      if (user.role !== "member" && email !== user.email) throw new BadRequestException("Tài khoản quản trị đổi email qua quản trị viên");
      if (email !== user.email) {
        user.email = email;
        user.emailVerified = false; // a new address must be proven again
        emailChanged = true;
      }
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim() || null;
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || null;
    const saved = await this.users.save(user);
    // Only for a new address: editing the name/phone must not re-send the link (there's a "Gửi lại email" button).
    if (emailChanged) await sendVerifyEmail(this.jwt, saved).catch((e) => console.error("[verify-email]", e));
    return profileOf(saved);
  }

  /** "Gửi lại email xác minh" on /account. */
  @Post("verify-email")
  async resendVerify(@Req() req: Req) {
    const user = await this.users.findOneBy({ id: req.user.sub });
    if (!user?.email) throw new BadRequestException("Chưa có email trong hồ sơ");
    if (user.emailVerified) return { sent: false, verified: true };
    await sendVerifyEmail(this.jwt, user);
    return { sent: true };
  }

  // ---- ♡ saved listings ----
  @Get("favorites")
  async favorites(@Req() req: Req) {
    const favs = await this.favs.find({ where: { userId: req.user.sub }, order: { createdAt: "DESC" } });
    const props = await this.db.getRepository(Property).findBy({ code: In(favs.map((f) => f.propertyCode)), status: In(PUBLIC) }); // a sold ♡ stays, marked "ĐÃ GIAO DỊCH"
    const byCode = new Map(props.map((p) => [p.code, p]));
    return favs.flatMap((f) => (byCode.has(f.propertyCode) ? [byCode.get(f.propertyCode)!] : []));
  }

  @Post("favorites/:code")
  async addFavorite(@Req() req: Req, @Param("code") code: string) {
    if (!(await this.db.getRepository(Property).findOneBy({ code, status: In(LISTED) }))) throw new NotFoundException("Không tìm thấy căn");
    await this.favs.upsert({ userId: req.user.sub, propertyCode: code }, ["userId", "propertyCode"]);
    return { saved: true };
  }

  @Delete("favorites/:code")
  async removeFavorite(@Req() req: Req, @Param("code") code: string) {
    await this.favs.delete({ userId: req.user.sub, propertyCode: code });
    return { saved: false };
  }

  // ---- request history ----
  @Get("leads")
  leads(@Req() req: Req) {
    return this.db.getRepository(Lead).find({
      where: { userId: req.user.sub },
      order: { createdAt: "DESC" },
      select: { id: true, source: true, propertyCode: true, message: true, status: true, createdAt: true },
    });
  }

  // ---- new-listing email alerts ----
  @Get("searches")
  listSearches(@Req() req: Req) {
    return this.searches.find({ where: { userId: req.user.sub }, order: { createdAt: "DESC" } });
  }

  @Post("searches")
  async addSearch(@Req() req: Req, @Body() dto: SavedSearchDto) {
    const user = await this.users.findOneBy({ id: req.user.sub });
    if (!user?.email) throw new BadRequestException("Thêm email vào hồ sơ để nhận thông báo căn mới");
    if (dto.minPrice != null && dto.maxPrice != null && dto.minPrice > dto.maxPrice) throw new BadRequestException("Giá từ phải nhỏ hơn giá đến");
    if ((await this.searches.countBy({ userId: user.id })) >= MAX_SEARCHES) throw new BadRequestException(`Tối đa ${MAX_SEARCHES} thông báo`);
    return this.searches.save(this.searches.create({ userId: user.id, type: dto.type, district: dto.district ?? null, minPrice: dto.minPrice ?? null, maxPrice: dto.maxPrice ?? null, minBeds: dto.minBeds ?? null, keyword: dto.keyword ?? null }));
  }

  @Delete("searches/:id")
  async removeSearch(@Req() req: Req, @Param("id", ParseIntPipe) id: number) {
    const res = await this.searches.delete({ id, userId: req.user.sub });
    if (!res.affected) throw new NotFoundException();
    return { deleted: true };
  }
}

/** Admin view of customers: who signed up, what they saved, how many requests / alerts. */
@Controller("admin/customers")
@UseGuards(JwtGuard)
@Roles("admin")
export class CustomersController {
  constructor(private db: DataSource) {}

  /** "Cấp quyền quản trị": turns a customer account (e.g. one made by "Tiếp tục với Google") into an admin. */
  @Post(":id/promote")
  async promote(@Param("id", ParseIntPipe) id: number) {
    const users = this.db.getRepository(User);
    const u = await users.findOneBy({ id, role: "member" });
    if (!u) throw new NotFoundException("Không tìm thấy tài khoản khách");
    // Google sign-in opens an admin only through a proven email, so warn instead of silently granting a dead login.
    if (!u.username && !(u.email && u.emailVerified)) throw new BadRequestException("Tài khoản này chưa có cách đăng nhập (chưa xác minh email, không có mật khẩu)");
    await users.update(id, { role: "admin" });
    return { ...profileOf({ ...u, role: "admin" }) };
  }

  @Get()
  async list() {
    const members = await this.db.getRepository(User).find({ where: { role: "member" }, order: { createdAt: "DESC" } });
    const ids = members.map((m) => m.id);
    const favs = ids.length ? await this.db.getRepository(Favorite).findBy({ userId: In(ids) }) : [];
    const searches = ids.length ? await this.db.getRepository(SavedSearch).findBy({ userId: In(ids) }) : [];
    const leads: { userId: number; n: string }[] = ids.length
      ? await this.db.getRepository(Lead).createQueryBuilder("l").select("l.userId", "userId").addSelect("COUNT(*)", "n").where("l.userId IN (:...ids)", { ids }).groupBy("l.userId").getRawMany()
      : [];
    return members.map((m) => ({
      ...profileOf(m),
      createdAt: m.createdAt,
      favorites: favs.filter((f) => f.userId === m.id).map((f) => f.propertyCode),
      alerts: searches.filter((s) => s.userId === m.id).length,
      requests: Number(leads.find((l) => l.userId === m.id)?.n ?? 0),
    }));
  }
}
