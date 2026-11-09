import { BadRequestException } from "@nestjs/common";
import { uploadBase } from "./uploads";
import { PROPERTY_STATUSES } from "./entities";
import { Type, plainToInstance } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateBy,
  ValidateIf,
  ValidateNested,
  validate,
  type ValidationError,
} from "class-validator";

/**
 * Validation for every admin-editable table. Used for create (all required fields present)
 * and update (only the fields sent are checked — see AdminController).
 * IsOptional = the column is nullable / has a default.
 */

// An image is either a file in frontend/public ("/images/abc.webp") or a file uploaded through
// POST /admin/uploads (R2 in production, the API's /uploads locally). Checked at validation time so .env is loaded.
const IMAGE_EXT = /\.(webp|jpe?g|png|gif)$/i;
const isUploaded = (v: string, ext: RegExp) => v.startsWith(uploadBase()) && /^[\w\-./]+$/.test(v.slice(uploadBase().length)) && ext.test(v);
export const isSiteImage = (v: unknown) => typeof v === "string" && v.length <= 500 && ((/^\/[\w\-./]+$/.test(v) && IMAGE_EXT.test(v)) || isUploaded(v, IMAGE_EXT));
const isBrochure = (v: unknown) => typeof v === "string" && (/^\/brochures\/[\w\-.]+\.pdf$/.test(v) || isUploaded(v, /\.pdf$/i));
const IMAGE_MSG = "$property phải là ảnh đã tải lên hoặc đường dẫn trong /public, vd /images/abc.webp";
const SiteImage = (each = false) => ValidateBy({ name: "siteImage", validator: { validate: isSiteImage, defaultMessage: () => IMAGE_MSG } }, { each });
const Brochure = () => ValidateBy({ name: "brochure", validator: { validate: isBrochure, defaultMessage: () => "brochure phải là file PDF đã tải lên hoặc trong /public/brochures" } });

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MSG = { message: "$property chỉ gồm chữ thường, số và dấu gạch ngang, vd eco-retreat" };
// Internal page ("/projects/eco-retreat") or an https link.
const LINK = /^(\/[\w\-./?=&%#]*|https:\/\/[^\s]+)$/;

export const PROPERTY_TYPES = ["rent", "resale", "project"] as const;
const VIDEO_URL = /^https:\/\/(www\.|m\.)?(tiktok\.com|youtube\.com|youtu\.be)\/\S*$/;
export const VIDEO_PLATFORMS = ["tiktok", "youtube"] as const;
export const LEAD_STATUSES = ["new", "contacted", "closed"] as const;

export class PropertyDto {
  @Matches(/^[A-Z0-9][A-Z0-9-]{2,29}$/, { message: "code: 3–30 ký tự in hoa, số, dấu -, vd ECO-1801" }) code: string;
  @IsIn(PROPERTY_TYPES) type: (typeof PROPERTY_TYPES)[number];
  @IsString() @Length(3, 150) title: string;
  @IsString() @Length(1, 50) priceLabel: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(1_000_000) priceMillion: number;
  @IsString() @Length(1, 50) district: string;
  @IsOptional() @IsInt() @Min(0) @Max(50) bedrooms: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(50) bathrooms: number | null;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(100_000) areaM2: number;
  @IsOptional() @IsBoolean() landArea?: boolean;
  @IsOptional() @IsString() @Length(0, 50) floorLabel?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @SiteImage(true) images: string[];
  @IsOptional() @Matches(VIDEO_URL, { message: "videoUrl phải là link https TikTok hoặc YouTube" }) @Length(1, 300) videoUrl: string | null;
  @IsOptional() @IsDateString() verifiedAt: string | null;
  @IsOptional() @IsString() @Length(0, 5000) description?: string;
  @IsOptional() @IsString() @Length(1, 50) direction: string | null;
  @IsOptional() @IsString() @Length(1, 50) furniture: string | null;
  @IsOptional() @IsString() @Length(1, 50) legal: string | null;
  @IsOptional() @Matches(SLUG, SLUG_MSG) @Length(1, 60) projectSlug: string | null;
  @IsOptional() @IsInt() @Min(1) buildingId: number | null;
  @IsOptional() @IsIn(PROPERTY_STATUSES) status?: (typeof PROPERTY_STATUSES)[number];
  @IsOptional() @IsBoolean() pinned?: boolean;
  @IsOptional() @IsDateString() postedAt?: string;
}

export class DistrictDto {
  @IsString() @Matches(/\S/, { message: "name không được để trống" }) @Length(1, 50) name: string;
  @IsOptional() @IsInt() @Min(0) @Max(999) sortOrder?: number;
}

export class LivingCostDto {
  @IsString() @Matches(/\S/, { message: "label không được để trống" }) @Length(1, 40) label: string;
  @IsString() @Matches(/\S/, { message: "value không được để trống" }) @Length(1, 80) value: string;
  @IsOptional() @IsInt() @Min(0) @Max(999) sortOrder?: number;
}

export class BuildingDto {
  @IsString() @Length(1, 60) name: string;
  @IsString() @Length(1, 50) district: string;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000) managementFee: number | null;
}

class FactDto {
  @IsString() @Length(1, 40) value: string;
  @IsString() @Length(1, 60) label: string;
}
class ProductTypeDto {
  @IsString() @Length(1, 40) name: string;
  @IsString() @Length(1, 200) description: string;
  @SiteImage() image: string;
}
class AmenityDto {
  @IsString() @Length(1, 60) name: string;
  @SiteImage() image: string;
}
class PolicyDto {
  @IsString() @Length(1, 100) title: string;
  @IsString() @Length(1, 1000) detail: string;
  @SiteImage() image: string;
}

export class ProjectDto {
  @Matches(SLUG, SLUG_MSG) @Length(2, 60) slug: string;
  @IsString() @Length(2, 100) name: string;
  @IsString() @Length(2, 100) location: string;
  @IsString() @Length(5, 200) address: string;
  @IsNumber() @Min(0.1) @Max(100_000) areaHa: number;
  @IsString() @Length(10, 500) summary: string;
  @IsString() @Length(10, 5000) overview: string;
  @IsOptional() @IsString() @Length(0, 100) tagline?: string;
  @SiteImage() heroImage: string;
  // "" = no image (the column defaults to ""), so an optional, empty field must pass
  @IsOptional() @ValidateIf((o) => o.overviewImage !== "") @SiteImage() overviewImage?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @ValidateNested({ each: true }) @Type(() => FactDto) facts?: FactDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(6) @ValidateNested({ each: true }) @Type(() => ProductTypeDto) productTypes?: ProductTypeDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => AmenityDto) amenities?: AmenityDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => PolicyDto) policies?: PolicyDto[];
  @IsString() @Length(3, 200) mapQuery: string;
  @IsOptional() @Brochure() brochure: string | null;
  @IsOptional() @IsString() @Length(0, 500) sourceNote?: string;
}

export class SlideDto {
  @IsString() @Length(2, 100) title: string;
  @IsString() @Length(2, 100) location: string;
  @IsString() @Length(0, 500) description: string;
  @SiteImage() image: string;
  @Matches(LINK, { message: "link phải là đường dẫn trong web (/projects/...) hoặc https://..." }) @Length(1, 300) link: string;
  @IsOptional() @IsInt() @Min(0) @Max(999) sortOrder?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class VideoDto {
  @IsIn(VIDEO_PLATFORMS) platform: (typeof VIDEO_PLATFORMS)[number];
  @IsString() @Length(1, 150) title: string;
  @Matches(VIDEO_URL, { message: "url phải là link https TikTok hoặc YouTube" }) @Length(1, 300) url: string;
  @IsOptional() @Matches(/^[A-Za-z0-9_-]{5,40}$/, { message: "embedId không hợp lệ" }) embedId: string | null;
  @SiteImage() thumbnail: string;
  @IsOptional() @IsString() @Length(0, 20) views?: string;
  @IsOptional() @Matches(/^\d{1,2}:\d{2}(:\d{2})?$/, { message: "duration dạng m:ss, vd 1:05" }) duration: string | null;
  @IsOptional() @IsBoolean() featured?: boolean;
}

export class TestimonialDto {
  @IsString() @Length(2, 80) name: string;
  @IsString() @Length(2, 120) deal: string;
  @IsString() @Length(10, 1000) quote: string;
  @IsOptional() @SiteImage() avatar: string | null;
  @IsInt() @Min(1) @Max(5) rating: number;
}

/** Admins only move a lead through its pipeline; contact details stay as the customer sent them. */
export class LeadStatusDto {
  @IsIn(LEAD_STATUSES) status: (typeof LEAD_STATUSES)[number];
}

// Leads are created by customers via POST /leads; admins may only change their status.
export const DTO = { properties: PropertyDto, buildings: BuildingDto, districts: DistrictDto, costs: LivingCostDto, projects: ProjectDto, slides: SlideDto, videos: VideoDto, testimonials: TestimonialDto, leads: LeadStatusDto } as const;
export type Resource = keyof typeof DTO;

// Nested errors (e.g. policies[0].title) come back as "policies.0.title: …".
const flatten = (errs: ValidationError[], path = ""): string[] =>
  errs.flatMap((e) => [...Object.values(e.constraints ?? {}).map((m) => (path ? `${path}${e.property}: ${m}` : m)), ...flatten(e.children ?? [], `${path}${e.property}.`)]);

/** Create: every required field must be present. Update: only the fields sent are checked, but null can't blank a required one. */
export async function check(name: Resource, body: unknown, partial: boolean) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw new BadRequestException("Body phải là một object JSON");
  const dto = plainToInstance(DTO[name] as never, body) as object;
  const errs = await validate(dto, { whitelist: true, forbidNonWhitelisted: true, skipUndefinedProperties: partial });
  if (errs.length) throw new BadRequestException(flatten(errs));
  return dto;
}

