import type { Metadata } from "next";
import AuthPage from "@/components/admin/AuthPage";

export const metadata: Metadata = {
  title: "Create account — RASA Admin",
  robots: { index: false, follow: false },
};

export default function AdminSignupPage() {
  return <AuthPage mode="signup" />;
}
