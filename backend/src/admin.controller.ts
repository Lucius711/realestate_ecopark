import { BadRequestException, Body, Controller, Delete, Get, MethodNotAllowedException, NotFoundException, Param, Post, Put, UseGuards } from "@nestjs/common";
import { DataSource, type ObjectLiteral, type Repository } from "typeorm";
import { check, type Resource } from "./dto";
import { Building, District, Lead, LivingCost, Project, Property, SavedSearch, Slide, Testimonial, Video } from "./entities";
import { JwtGuard, Roles } from "./auth";
import { notifyMatches } from "./notify";

const RESOURCES = { properties: Property, buildings: Building, districts: District, costs: LivingCost, projects: Project, slides: Slide, videos: Video, testimonials: Testimonial, leads: Lead } as const;
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
    return this.repo(r).find({ order: (r === "districts" || r === "costs" ? { sortOrder: "ASC", id: "ASC" } : { [this.key(r)]: r === "leads" ? "DESC" : "ASC" }) as never });
  }

  @Post(":resource")
  async create(@Param("resource") r: string, @Body() body: Record<string, unknown>) {
    const repo = this.repo(r);
    if (r === "leads") throw new MethodNotAllowedException("Khách hàng tự gửi qua form, không tạo tay");
    const dto = await check(r as Name, body, false);
    await this.assertDistrict(r, dto);
    const key = this.key(r);
    if (key !== "id" && (await repo.findOneBy(this.where(r, String((dto as Record<string, unknown>)[key]))))) throw new BadRequestException(`${key} đã tồn tại`);
    return this.afterSave(r, await this.save(repo, dto));
  }

  /** Listings and buildings may only use a phân khu that exists in the "Phân khu" list. */
  private async assertDistrict(r: string, dto: object) {
    const name = (dto as { district?: unknown }).district;
    if ((r === "properties" || r === "buildings") && typeof name === "string" && !(await this.db.getRepository(District).existsBy({ name })))
      throw new BadRequestException(`Phân khu “${name}” không có trong danh sách. Thêm ở mục Phân khu.`);
  }

  /** A unique name taken twice (e.g. two buildings called "S1") is a form error, not a 500. */
  private async save(repo: Repository<ObjectLiteral>, row: unknown) {
    try {
      return await repo.save(row as never);
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new BadRequestException("Tên này đã có rồi");
      throw e;
    }
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
    await this.assertDistrict(r, dto);
    const name = (dto as { name?: string }).name;
    const old = (found as { name?: string }).name;
    if (r === "districts" && name && old && name !== old) {
      // Rows store the phân khu by name: rename it everywhere in one go.
      if (await this.db.getRepository(District).existsBy({ name })) throw new BadRequestException("Tên này đã có rồi");
      return this.db.transaction(async (t) => {
        for (const T of [Property, Building, SavedSearch]) await t.getRepository(T).update({ district: old } as never, { district: name } as never);
        return t.getRepository(District).save({ ...(found as District), ...dto } as never);
      });
    }
    return this.afterSave(r, await this.save(repo, { ...(found as object), ...dto }));
  }

  @Delete(":resource/:id")
  async remove(@Param("resource") r: string, @Param("id") id: string) {
    if (r === "districts") {
      const d = await this.db.getRepository(District).findOneBy({ id: Number(id) });
      const used = d ? (await this.db.getRepository(Property).countBy({ district: d.name })) + (await this.db.getRepository(Building).countBy({ district: d.name })) : 0;
      if (used) throw new BadRequestException(`Còn ${used} căn/tòa đang dùng phân khu “${d!.name}”. Đổi chúng sang phân khu khác trước khi xoá.`);
    }
    // Listings of a deleted building keep existing, just without a building.
    if (r === "buildings") await this.db.getRepository(Property).update({ buildingId: Number(id) }, { buildingId: null });
    const res = await this.repo(r).delete(this.where(r, id));
    if (!res.affected) throw new NotFoundException();
    return { deleted: true };
  }
}
