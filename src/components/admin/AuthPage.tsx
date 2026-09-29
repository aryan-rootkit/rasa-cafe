import { redirect } from "next/navigation";
import AuthForm, { type AuthMode } from "@/components/admin/AuthForm";
import { getAdminSession } from "@/lib/auth/guard";

export default async function AuthPage({ mode }: { mode: AuthMode }) {
  if (await getAdminSession()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10 font-sans text-stone-900">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="font-serif text-3xl tracking-[0.14em]">RASA</p>
        <p className="mt-1 text-sm text-stone-500">Website admin</p>
        <AuthForm initialMode={mode} />
      </div>
    </div>
  );
}
