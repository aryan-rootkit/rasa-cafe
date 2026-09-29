import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — RASA Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 font-sans text-stone-900">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="font-serif text-3xl tracking-[0.14em]">RASA</p>
        <h1 className="mt-6 text-lg font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage website content, hero images and the menu.
        </p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-stone-500">
          Don&apos;t have an account?{" "}
          <Link href="/admin/signup" className="font-medium text-stone-900 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
