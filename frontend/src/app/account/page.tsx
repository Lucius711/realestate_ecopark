import type { Metadata } from "next";
import Shell from "@/components/Shell";
import AccountPage from "@/components/account/AccountPage";
import { getDistricts } from "@/lib/api";

export const metadata: Metadata = { title: "Tài khoản của tôi", robots: { index: false, follow: false } };

export default async function Page() {
  const districts = await getDistricts();
  return (
    <Shell>
      <AccountPage districts={districts} />
    </Shell>
  );
}
