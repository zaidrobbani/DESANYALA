import type React from "react";
import MainLayout from "@/layout/MainLayout";

export default function SimulasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
