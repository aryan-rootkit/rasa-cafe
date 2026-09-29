import type { Metadata } from "next";
import Link from "next/link";
import SignupForm from "@/components/admin/SignupForm";

export const metadata: Metadata = {
  title: "Create account — RASA Admin",
  robots: { index: false, follow: false },
};

export default function AdminSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10 font-sans text-stone-900">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="font-serif text-3xl tracking-[0.14em]">RASA</p>
        <h1 className="mt-6 text-lg font-semibold">Create an admin account</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage website content, hero images and the menu.
        </p>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/admin/login" className="font-medium text-stone-900 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
