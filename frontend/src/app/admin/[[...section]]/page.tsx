import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = { title: "Quản trị website", robots: { index: false, follow: false } };

export default async function AdminPage({ params }: { params: Promise<{ section?: string[] }> }) {
  return <AdminApp section={(await params).section?.[0]} />;
}
