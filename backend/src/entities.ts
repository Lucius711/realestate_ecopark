import { Check, Column, CreateDateColumn, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";

// App-level rules live in dto.ts; the @Check constraints below are a DB safety net for the critical ones.

// Shapes mirror frontend/src/lib/types.ts — keep both in sync.

/**
 * available: on the site + new-listing emails · deposit: on the site with an "ĐÃ CỌC" badge, no emails ·
 * sold: off the lists, its page stays up with "ĐÃ GIAO DỊCH" (old shared links keep working) · draft: nowhere (404).
 */
export const PROPERTY_STATUSES = ["available", "deposit", "sold", "draft"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];
/** Shown in listings / search / favorites. */
export const LISTED: PropertyStatus[] = ["available", "deposit"];
/** Has a public page. */
export const PUBLIC: PropertyStatus[] = ["available", "deposit", "sold"];

@Entity("properties")
@Check(`"status" IN ('available','deposit','sold','draft')`)
@Check(`"type" IN ('rent','resale','project') AND "priceMillion" >= 0 AND "areaM2" > 0 AND ("bedrooms" IS NULL OR "bedrooms" >= 0) AND ("bathrooms" IS NULL OR "bathrooms" >= 0)`)
export class Property {
  @PrimaryColumn() code: string;
  @Index() @Column() type: "rent" | "resale" | "project";
  @Column() title: string;
  @Column() priceLabel: string;
  @Column("numeric", { transformer: { to: (v: number) => v, from: (v: string) => Number(v) } }) priceMillion: number;
  @Column() district: string;
  @Column("int", { nullable: true }) bedrooms: number | null;
  @Column("int", { nullable: true }) bathrooms: number | null;
  @Column("real") areaM2: number;
  @Column({ default: false }) landArea: boolean;
  @Column({ default: "" }) floorLabel: string;
  @Column("jsonb", { default: [] }) images: string[];
  /** TikTok / YouTube review of this listing; plays in a popup on the detail page. */
  @Column("varchar", { nullable: true }) videoUrl: string | null;
  /** When anh Tuấn saw the place in person ("Đã xem thực tế"); null = not yet. */
  @Column("timestamptz", { nullable: true }) verifiedAt: Date | null;
  @Column("text", { default: "" }) description: string;
  @Column("varchar", { nullable: true }) direction: string | null;
  @Column("varchar", { nullable: true }) furniture: string | null;
  @Column("varchar", { nullable: true }) legal: string | null;
  @Index() @Column("varchar", { nullable: true }) projectSlug: string | null;
  /** Tòa (see Building). Customers see the building, never the internal `code`. */
  @Column("int", { nullable: true }) buildingId: number | null;
  @Index() @Column({ default: "available" }) status: PropertyStatus;
  /** Always first in the homepage "Nổi bật" rows. */
  @Column({ default: false }) pinned: boolean;
  @Column("timestamptz", { default: () => "now()" }) postedAt: Date;
}

@Entity("projects")
@Check(`"areaHa" > 0`)
export class Project {
  @PrimaryColumn() slug: string;
  @Column() name: string;
  @Column() location: string;
  @Column() address: string;
  @Column("real") areaHa: number;
  @Column("text") summary: string;
  @Column("text") overview: string;
  @Column({ default: "" }) tagline: string;
  @Column() heroImage: string;
  @Column({ default: "" }) overviewImage: string;
  @Column("jsonb", { default: [] }) facts: { value: string; label: string }[];
  @Column("jsonb", { default: [] }) productTypes: { name: string; description: string; image: string }[];
  @Column("jsonb", { default: [] }) amenities: { name: string; image: string }[];
  @Column("jsonb", { default: [] }) policies: { title: string; detail: string; image: string }[];
  @Column() mapQuery: string;
  @Column("varchar", { nullable: true }) brochure: string | null;
  @Column("text", { default: "" }) sourceNote: string;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}

/** "Dự án đang mở bán" homepage slider — admin edits these. */
@Entity("slides")
export class Slide {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column() location: string;
  @Column("text") description: string;
  @Column() image: string;
  @Column() link: string;
  @Column("int", { default: 0 }) sortOrder: number;
  @Column({ default: true }) active: boolean;
}

@Entity("videos")
@Check(`"platform" IN ('tiktok','youtube')`)
export class Video {
  @PrimaryGeneratedColumn() id: number;
  @Column() platform: "tiktok" | "youtube";
  @Column() title: string;
  @Column() url: string;
  @Column("varchar", { nullable: true }) embedId: string | null;
  @Column() thumbnail: string;
  @Column({ default: "" }) views: string;
  @Column("varchar", { nullable: true }) duration: string | null;
  @Column({ default: false }) featured: boolean;
}

@Entity("testimonials")
@Check(`"rating" BETWEEN 1 AND 5`)
export class Testimonial {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column() deal: string;
  @Column("text") quote: string;
  @Column("varchar", { nullable: true }) avatar: string | null;
  @Column("int", { default: 5 }) rating: number;
}

/** Contact / viewing requests from the site forms. */
@Entity("leads")
@Check(`"status" IN ('new','contacted','closed')`)
export class Lead {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column() phone: string;
  @Column("varchar", { nullable: true }) email: string | null;
  @Column("text", { nullable: true }) message: string | null;
  @Column() source: string;
  @Column("varchar", { nullable: true }) propertyCode: string | null;
  @Column({ default: "new" }) status: string;
  /** Set when a signed-in member sent the form → shows up in their "Yêu cầu của tôi". */
  @Index() @Column("int", { nullable: true }) userId: number | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}

/**
 * admin: the whole admin site — content, leads, accounts.
 * member: a customer who signed up — saved listings, request history, new-listing emails; no admin API.
 */
export const ROLES = ["admin", "member"] as const;
export type Role = (typeof ROLES)[number];

@Entity("users")
@Check(`"role" IN ('admin','member')`)
export class User {
  @PrimaryGeneratedColumn() id: number;
  /** Login name for username + password sign-in (stored lowercase). */
  @Index({ unique: true }) @Column("varchar", { nullable: true }) username: string | null;
  /** Only used to match "Tiếp tục với Google / Facebook"; optional. */
  @Index({ unique: true }) @Column("varchar", { nullable: true }) email: string | null;
  /** True once the owner proved the address (Google/Facebook, the emailed link) or an admin set it. Unverified emails get no alerts and never match an OAuth sign-in. */
  @Column({ default: false }) emailVerified: boolean;
  @Column("varchar", { nullable: true }) passwordHash: string | null;
  @Column({ default: "member" }) role: Role;
  /** Profile used to pre-fill the site forms. */
  @Column("varchar", { nullable: true }) fullName: string | null;
  @Column("varchar", { nullable: true }) phone: string | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}

/** "♡ Lưu" — a member's saved listing. */
@Entity("favorites")
@Unique(["userId", "propertyCode"])
export class Favorite {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column("int") userId: number;
  @Column() propertyCode: string;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}

/** "Nhận thông báo căn mới": listing filters a member wants emails for. Null = any. */
@Entity("saved_searches")
@Check(`"type" IN ('rent','resale','project')`)
export class SavedSearch {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column("int") userId: number;
  @Column() type: "rent" | "resale" | "project";
  @Column("varchar", { nullable: true }) district: string | null;
  @Column("numeric", { nullable: true, transformer: { to: (v: number | null) => v, from: (v: string | null) => (v == null ? null : Number(v)) } }) minPrice: number | null;
  @Column("numeric", { nullable: true, transformer: { to: (v: number | null) => v, from: (v: string | null) => (v == null ? null : Number(v)) } }) maxPrice: number | null;
  @Column("int", { nullable: true }) minBeds: number | null;
  @Column("varchar", { nullable: true }) keyword: string | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}

/** One email per (saved search, listing) — stops repeats when a listing is edited again. */
@Entity("sent_alerts")
@Unique(["searchId", "propertyCode"])
export class SentAlert {
  @PrimaryGeneratedColumn() id: number;
  @Column("int") searchId: number;
  @Column() propertyCode: string;
  @CreateDateColumn({ type: "timestamptz" }) sentAt: Date;
}

/** A building (tòa): its phân khu and monthly management fee. Listings pick one and inherit the phân khu in the admin form. */
@Entity("buildings")
@Check(`"managementFee" IS NULL OR "managementFee" >= 0`)
export class Building {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column() name: string;
  @Column() district: string;
  /** VND per m² per month; null = not announced yet (the site shows "Theo BQL"). */
  @Column("int", { nullable: true }) managementFee: number | null;
}

/** A phân khu. Listings, buildings and saved searches store its name, so renaming one is cascaded (see AdminController). */
@Entity("districts")
export class District {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column() name: string;
  /** Smaller first in every dropdown. */
  @Column("int", { default: 0 }) sortOrder: number;
}

/** One line of the "Chi phí hàng tháng" box shown on every listing (điện, nước, gửi xe…). Same for all listings, edited in admin. */
@Entity("living_costs")
export class LivingCost {
  @PrimaryGeneratedColumn() id: number;
  @Column() label: string;
  /** Free text, e.g. "Khoảng 3.500 – 4.000đ/kWh". */
  @Column() value: string;
  @Column("int", { default: 0 }) sortOrder: number;
}

export const ENTITIES = [Property, Building, District, LivingCost, Project, Slide, Video, Testimonial, Lead, User, Favorite, SavedSearch, SentAlert];
