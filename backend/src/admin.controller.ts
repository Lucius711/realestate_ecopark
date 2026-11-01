import { BadRequestException, Body, Controller, Delete, Get, MethodNotAllowedException, NotFoundException, Param, Post, Put, UseGuards } from "@nestjs/common";
import { DataSource } from "typeorm";
import { check, type Resource } from "./dto";
import { Lead, Project, Property, Slide, Testimonial, Video } from "./entities";
import { JwtGuard, Roles } from "./auth";
import { notifyMatches } from "./notify";

const RESOURCES = { properties: Property, projects: Project, slides: Slide, videos: Video, testimonials: Testimonial, leads: Lead } as const;
type Name = Resource;
/**
 * Minimal content API for an admin UI (or curl/Postman): e.g. reorder/replace homepage slides.
 * The website's ISR picks up changes within 60 s.
 */
@Controller("admin")
@UseGuards(JwtGuard)
@Roles("admin") // members (customer sign-ups) never reach the admin API
export class AdminController {
  constructor(private db: DataSource) {}

  private repo(name: string) {
    const entity = RESOURCES[name as Name];
    if (!entity) throw new NotFoundException();
    return this.db.getRepository(entity as never);
  }

  private key(name: string) {
    return name === "properties" ? "code" : name === "projects" ? "slug" : "id";
  }

  private where(name: string, id: string) {
    const k = this.key(name);
    return { [k]: k === "id" ? Number(id) : id } as never;
  }

  @Get(":resource")
  list(@Param("resource") r: string) {
    return this.repo(r).find({ order: { [this.key(r)]: r === "leads" ? "DESC" : "ASC" } as never });
  }

  @Post(":resource")
  async create(@Param("resource") r: string, @Body() body: Record<string, unknown>) {
    const repo = this.repo(r);
    if (r === "leads") throw new MethodNotAllowedException("Khách hàng tự gửi qua form, không tạo tay");
    const dto = await check(r as Name, body, false);
    const key = this.key(r);
    if (key !== "id" && (await repo.findOneBy(this.where(r, String((dto as Record<string, unknown>)[key]))))) throw new BadRequestException(`${key} đã tồn tại`);
    return this.afterSave(r, await repo.save(dto as never));
  }

  /** New/updated published listings → email members whose saved search matches (background, never blocks the save). */
  private afterSave<T>(r: string, saved: T) {
    if (r === "properties") notifyMatches(this.db, saved as never).catch((e) => console.error("[notify]", e));
    return saved;
  }

  @Put(":resource/:id")
  async update(@Param("resource") r: string, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    const repo = this.repo(r);
    const found = await repo.findOneBy(this.where(r, id));
    if (!found) throw new NotFoundException();
    const { [this.key(r)]: _ignored, id: _id, ...changes } = body ?? {}; // primary key is not editable
    const dto = await check(r as Name, changes, true);
    return this.afterSave(r, await repo.save({ ...(found as object), ...dto } as never));
  }

  @Delete(":resource/:id")
  async remove(@Param("resource") r: string, @Param("id") id: string) {
    const res = await this.repo(r).delete(this.where(r, id));
    if (!res.affected) throw new NotFoundException();
    return { deleted: true };
  }
}
