import type { ReactNode } from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import SocialRail from "./SocialRail";
import { LeadProvider } from "./LeadProvider";
import { AuthProvider } from "@/lib/auth";
import { dict, type Lang } from "@/lib/i18n";
import { getProperties, TYPE_SLUG } from "@/lib/api";

/** Page chrome shared by every route: sticky nav, fixed social rail, footer with contact form. */
export default async function Shell({ children, lang = "vi" }: { children: ReactNode; lang?: Lang }) {
  const all = await getProperties();
  const counts = Object.fromEntries(Object.entries(TYPE_SLUG).map(([type, slug]) => [slug, all.filter((p) => p.type === type).length]));
  return (
    <AuthProvider>
    <LeadProvider lang={lang}>
      <Nav lang={lang} counts={counts} />
      <main>{children}</main>
      <SocialRail followLabel={dict[lang].footer.follow} />
      <Footer lang={lang} />
    </LeadProvider>
    </AuthProvider>
  );
}
