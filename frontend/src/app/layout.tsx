import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Nguyễn Hồng Tuấn – Bất động sản Ecopark", template: "%s | Nguyễn Hồng Tuấn Ecopark" },
  description: "Mua bán, cho thuê căn hộ, biệt thự, shophouse và hàng dự án tại khu đô thị Ecopark cùng chuyên viên Nguyễn Hồng Tuấn.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
