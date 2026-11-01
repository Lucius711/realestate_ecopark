import type { Metadata } from "next";
import Shell from "@/components/Shell";
import AccountPage from "@/components/account/AccountPage";

export const metadata: Metadata = { title: "Tài khoản của tôi", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Shell>
      <AccountPage />
    </Shell>
  );
}
