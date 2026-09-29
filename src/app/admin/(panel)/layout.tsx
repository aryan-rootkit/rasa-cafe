import type { ReactNode } from "react";
import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "RASA Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminPage();
  return <AdminShell username={session.sub}>{children}</AdminShell>;
}
