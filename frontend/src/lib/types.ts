// Shared shapes returned by the NestJS API (see backend/src/*/entities).

export type PropertyType = "rent" | "resale" | "project";

export interface Property {
  code: string;
  type: PropertyType;
  title: string;
  /** Display price, e.g. "7 triệu/tháng", "3,85 tỷ", "Từ 3,2 tỷ" */
  priceLabel: string;
  /** Numeric price in million VND (monthly for rent) – used for filtering/sorting */
  priceMillion: number;
  district: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number;
  landArea: boolean;
  floorLabel: string;
  images: string[];
  hasVideo: boolean;
  verified: boolean;
  description: string;
  direction?: string | null;
  furniture?: string | null;
  legal?: string | null;
  projectSlug?: string | null;
  postedAt: string;
}

export interface Slide {
  id: number;
  title: string;
  location: string;
  description: string;
  image: string;
  link: string;
  sortOrder: number;
  active: boolean;
}

export interface Video {
  id: number;
  platform: "tiktok" | "youtube";
  title: string;
  url: string;
  embedId?: string | null;
  thumbnail: string;
  views: string;
  duration?: string | null;
  featured: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  deal: string;
  quote: string;
  avatar?: string | null;
  rating: number;
}

export interface Project {
  slug: string;
  name: string;
  location: string;
  address: string;
  areaHa: number;
  summary: string;
  overview: string;
  /** Overview heading, e.g. "Nghỉ dưỡng mỗi ngày" */
  tagline: string;
  heroImage: string;
  overviewImage: string;
  facts: { value: string; label: string }[];
  productTypes: { name: string; description: string; image: string }[];
  amenities: { name: string; image: string }[];
  policies: { title: string; detail: string; image: string }[];
  mapQuery: string;
  /** PDF under /public/brochures, downloaded after the visitor leaves name + phone. */
  brochure: string | null;
  sourceNote: string;
}

export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source: string;
  propertyCode?: string;
}
