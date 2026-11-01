import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Đăng ký tài khoản", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <AuthShell image="/images/sunset-road.webp">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
