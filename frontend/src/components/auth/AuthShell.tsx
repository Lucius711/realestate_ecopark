import Image from "next/image";
import Link from "next/link";
import { Icon } from "../Icons";
import { API } from "@/lib/api";

/** Split layout used by /login: photo + brand on the left, form card on the right. */
export default function AuthShell({ children, image = "/images/forest-rays.webp" }: { children: React.ReactNode; image?: string }) {
  return (
    <main className="grid min-h-screen bg-page lg:grid-cols-[1fr_560px]">
      <div className="relative hidden lg:block">
        <Image src={image} alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-espDeep/90 via-espDeep/30 to-espDeep/40" />
        <Link href="/" className="absolute left-12 top-10 flex flex-col">
          <span className="text-[22px] font-extrabold tracking-[0.08em] text-white">NGUYỄN HỒNG TUẤN</span>
          <span className="whitespace-pre text-[9px] font-medium tracking-[0.3em] text-soft">{"ECOPARK  REAL  ESTATE"}</span>
        </Link>
        <p className="absolute bottom-12 left-12 max-w-[440px] text-[28px] font-bold leading-snug text-white">An cư giữa miền xanh — tìm ngôi nhà phù hợp cùng anh Tuấn.</p>
      </div>
      <div className="flex flex-col justify-center px-6 py-12 sm:px-14">
        <Link href="/" className="mb-10 flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-esp">
          <Icon name="chevL" size={14} />
          Về trang chủ
        </Link>
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** "hoặc" divider + Google / Facebook buttons (the API runs the OAuth flow and returns to /login#token=…). */
export function SocialButtons({ verb = "Tiếp tục" }: { verb?: string }) {
  const social = "flex h-12 w-full items-center justify-center gap-3 rounded border text-[14px] font-semibold transition";
  return (
    <>
      <div className="flex items-center gap-3 text-[12px] text-soft">
        <span className="h-px flex-1 bg-lineL" /> hoặc <span className="h-px flex-1 bg-lineL" />
      </div>
      <div className="flex flex-col gap-3">
        <a href={`${API}/auth/oauth/google`} className={`${social} border-line bg-white text-ink hover:bg-cream`}>
          <GoogleMark /> {verb} với Google
        </a>
        <a href={`${API}/auth/oauth/facebook`} className={`${social} border-[#1877F2] bg-[#1877F2] text-white hover:brightness-110`}>
          <Icon name="facebook" size={18} /> {verb} với Facebook
        </a>
      </div>
    </>
  );
}

export const inputCls =
  "h-12 w-full rounded border border-line bg-white px-4 text-[14px] font-normal text-ink placeholder:text-soft focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 aria-[invalid=true]:border-price";
export const labelCls = "flex flex-col gap-1.5 text-[13px] font-semibold text-esp";
