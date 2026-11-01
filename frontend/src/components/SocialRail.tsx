import { Icon, type IconName } from "./Icons";
import { CONTACT } from "@/lib/contact";

const items: { icon: IconName; href: string; label: string; size?: number }[][] = [
  [
    { icon: "mail", href: `mailto:${CONTACT.email}`, label: "Email" },
    { icon: "phone", href: `tel:${CONTACT.phoneTel}`, label: "Gọi điện" },
  ],
  [
    { icon: "facebook", href: CONTACT.facebook, label: "Facebook" },
    { icon: "zalo", href: CONTACT.zalo, label: "Zalo", size: 22 },
    { icon: "tiktok", href: CONTACT.tiktok, label: "TikTok" },
    { icon: "youtube", href: CONTACT.youtube, label: "YouTube" },
  ],
];

/** Figma: "Social rail" – fixed to the right edge while scrolling. */
export default function SocialRail({ followLabel = "THEO DÕI" }: { followLabel?: string }) {
  return (
    <aside className="fixed right-4 top-[300px] z-40 hidden flex-col items-center gap-2.5 md:flex xl:right-6" aria-label="Mạng xã hội">
      {items.map((group, gi) => (
        <div key={gi} className="flex flex-col items-center gap-2.5">
          {gi > 0 && <span className="h-px w-7 bg-white/70 mix-blend-difference" aria-hidden />}
          {group.map((it) => (
            <a
              key={it.label}
              href={it.href}
              target={it.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              aria-label={it.label}
              className="flex size-9 items-center justify-center rounded-full bg-gold text-white transition-transform hover:scale-110"
            >
              <Icon name={it.icon} size={it.size ?? 16} />
            </a>
          ))}
        </div>
      ))}
      <span className="h-px w-7 bg-white/70 mix-blend-difference" aria-hidden />
      <span className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-gold [writing-mode:vertical-rl]">{followLabel}</span>
    </aside>
  );
}
