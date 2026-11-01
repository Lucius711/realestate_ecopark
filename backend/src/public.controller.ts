import { Body, Controller, Get, Headers, HttpException, Ip, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { IsEmail, IsOptional, IsString, Length, Matches, ValidateIf } from "class-validator";
import { In, Repository } from "typeorm";
import { LISTED, Lead, PUBLIC, Project, Property, Slide, Testimonial, Video } from "./entities";
import type { JwtUser } from "./auth";
import { SlidingWindow } from "./rate-limit";

export class CreateLeadDto {
  @IsString() @Matches(/\S/, { message: "Vui lòng nhập họ tên" }) @Length(1, 80) name: string;
  @Matches(/^(?=(?:\D*\d){8,15}\D*$)[0-9 +().-]{8,20}$/, { message: "Số điện thoại không hợp lệ" }) phone: string;
  @ValidateIf((o) => !!o.email) @IsEmail() @Length(0, 120) email?: string; // forms send "" when left blank
  @IsOptional() @IsString() @Length(0, 1000) message?: string;
  @Matches(/^[a-z0-9:-]{1,60}$/, { message: "source không hợp lệ" }) source: string;
  @IsOptional() @Matches(/^[A-Z0-9][A-Z0-9-]{2,29}$/, { message: "propertyCode không hợp lệ" }) propertyCode?: string;
}

// Per IP (the real visitor IP once TRUST_PROXY is set in production).
const leadLimit = new SlidingWindow<string>(5, 10 * 60 * 1000);

/** Read-only endpoints the website uses, plus the public lead form. */
@Controller()
export class PublicController {
  constructor(
    @InjectRepository(Property) private props: Repository<Property>,
    @InjectRepository(Project) private projects: Repository<Project>,
    @InjectRepository(Slide) private slides: Repository<Slide>,
    @InjectRepository(Video) private videos: Repository<Video>,
    @InjectRepository(Testimonial) private testimonials: Repository<Testimonial>,
    @InjectRepository(Lead) private leads: Repository<Lead>,
    private jwt: JwtService,
  ) {}

  @Get("properties")
  listProperties(@Query("type") type?: string) {
    if (type && !["rent", "resale", "project"].includes(type)) return [];
    return this.props.find({ where: { status: In(LISTED), ...(type ? { type: type as Property["type"] } : {}) }, order: { postedAt: "DESC" } });
  }

  @Get("properties/:code")
  async getProperty(@Param("code") code: string) {
    const p = await this.props.findOneBy({ code, status: In(PUBLIC) }); // sold listings keep their page
    if (!p) throw new NotFoundException();
    return p;
  }

  @Get("projects/:slug")
  async getProject(@Param("slug") slug: string) {
    const p = await this.projects.findOneBy({ slug });
    if (!p) throw new NotFoundException();
    return p;
  }

  @Get("slides")
  listSlides() {
    return this.slides.find({ where: { active: true }, order: { sortOrder: "ASC", id: "ASC" } });
  }

  @Get("videos")
  listVideos() {
    return this.videos.find({ order: { featured: "DESC", id: "DESC" } }); // pinned first, then newest — a new video must not land below the 10 shown
  }

  @Get("testimonials")
  listTestimonials() {
    return this.testimonials.find({ order: { id: "ASC" } });
  }

  @Post("leads")
  async createLead(@Body() dto: CreateLeadDto, @Ip() ip: string, @Headers("authorization") auth?: string) {
    if (leadLimit.full(ip)) throw new HttpException("Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút hoặc gọi trực tiếp", 429);
    leadLimit.hit(ip);
    // Optional login: a valid token links the request to the member's "Yêu cầu của tôi"; a bad/expired one is just ignored.
    const userId = await this.jwt
      .verifyAsync<JwtUser>(/^Bearer (.+)$/.exec(auth ?? "")?.[1] ?? "")
      .then((u) => u.sub)
      .catch(() => null);
    const lead = await this.leads.save(this.leads.create({ ...dto, email: dto.email || null, message: dto.message ?? null, propertyCode: dto.propertyCode ?? null, userId }));
    // shortcut: no notification yet — add a Zalo/Telegram/email push here when anh Tuấn picks a channel.
    return { id: lead.id };
  }
}
