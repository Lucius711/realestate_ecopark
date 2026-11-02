import seed from "@/data/seed.json";
import type { LeadInput, Project, Property, PropertyType, Slide, Testimonial, Video } from "./types";

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

/**
 * Reads from the NestJS API. When the API is down: sample data from seed.json in local dev,
 * empty lists in production (a live site must never show made-up listings).
 */
async function get<T>(path: string, fallback: () => T): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}

type Seed = { properties: Property[]; slides: Slide[]; videos: Video[]; testimonials: Testimonial[]; projects: Project[] };
const S: Seed =
  process.env.NODE_ENV === "production"
    ? { properties: [], slides: [], videos: [], testimonials: [], projects: [] }
    : (seed as unknown as Seed);

export const TYPE_SLUG: Record<PropertyType, string> = {
  rent: "for-rent",
  resale: "resale",
  project: "projects",
};
export const SLUG_TYPE: Record<string, PropertyType> = {
  "for-rent": "rent",
  "resale": "resale",
  "projects": "project",
};

export const getProperties = (type?: PropertyType) =>
  get<Property[]>(type ? `/properties?type=${type}` : "/properties", () =>
    S.properties.filter((p) => (p.status === "available" || p.status === "deposit") && (!type || p.type === type)),
  );

export const getProperty = (code: string) =>
  get<Property | null>(`/properties/${encodeURIComponent(code)}`, () => S.properties.find((p) => p.code === code && p.status !== "draft") ?? null);

export const getSlides = () => get<Slide[]>("/slides", () => S.slides.filter((s) => s.active));
export const getVideos = () => get<Video[]>("/videos", () => S.videos);
export const getTestimonials = () => get<Testimonial[]>("/testimonials", () => S.testimonials);
export const getProject = (slug: string) =>
  get<Project | null>(`/projects/${slug}`, () => S.projects.find((p) => p.slug === slug) ?? null);
export const seedProjects = S.projects;
export const seedProperties = S.properties;

/** Client-side: submit a contact / viewing request. */
/** headers: pass the auth header when signed in, so the request shows in the member's history. */
export async function postLead(lead: LeadInput, headers: Record<string, string> = {}): Promise<boolean> {
  try {
    const res = await fetch(`${API}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(lead),
    });
    return res.ok;
  } catch {
    return false;
  }
}
