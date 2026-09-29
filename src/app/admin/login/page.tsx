import type { Metadata } from "next";
import AuthPage from "@/components/admin/AuthPage";

export const metadata: Metadata = {
  title: "Sign in — RASA Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AuthPage mode="login" />;
}
