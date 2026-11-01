import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Nguyen Tuan – Ecopark Real Estate",
  description: "Rent, buy and invest in Ecopark township with real estate specialist Nguyen Hong Tuan.",
  alternates: { languages: { vi: "/", en: "/en" } },
};

export default function Page() {
  return <HomePage lang="en" />;
}
