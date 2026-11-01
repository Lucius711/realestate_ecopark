// Placeholders from the design ("09xx xxx xxx", "tuan@email.com") – replace with Anh Tuấn's real details via env.
export const CONTACT = {
  phone: process.env.NEXT_PUBLIC_PHONE ?? "09xx xxx xxx",
  phoneTel: process.env.NEXT_PUBLIC_PHONE_TEL ?? "09xxxxxxxx",
  email: process.env.NEXT_PUBLIC_EMAIL ?? "tuan@email.com",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK ?? "https://facebook.com/",
  zalo: process.env.NEXT_PUBLIC_ZALO ?? "https://zalo.me/",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK ?? "https://www.tiktok.com/@thegreennest77",
  tiktokHandle: "@thegreennest77",
  tiktokFollowers: "400+",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE ?? "https://www.youtube.com/",
};
