"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signupInputSchema, firstIssue } from "@/lib/content/schema";
import { cn } from "@/lib/cn";

export type AuthMode = "login" | "signup";

const COPY = {
  login: { title: "Welcome back", button: "Sign in", busy: "Signing in…" },
  signup: { title: "Create your account", button: "Create account", busy: "Creating account…" },
};

export default function AuthForm({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    window.history.replaceState(null, "", next === "login" ? "/admin/login" : "/admin/signup");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      username: String(form.get("username") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };

    if (!input.username || !input.password) {
      setError("Enter a username and password.");
      return;
    }
    if (mode === "signup") {
      const parsed = signupInputSchema.safeParse(input);
      if (!parsed.success) {
        setError(firstIssue(parsed.error));
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 rounded-lg bg-stone-100 p-1 text-sm font-medium" role="tablist">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cn(
              "rounded-md py-2 transition",
              mode === m ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
            )}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h1 className="mt-6 text-lg font-semibold">{COPY[mode].title}</h1>

      <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
        <label className="block">
          <span className="text-sm font-medium">Username</span>
          <input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={64}
            className="admin-input mt-1.5"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <span className="relative mt-1.5 block">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              maxLength={200}
              className="admin-input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-400 hover:text-stone-700"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
          {mode === "signup" && (
            <span className="mt-1 block text-xs text-stone-500">At least 8 characters.</span>
          )}
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="admin-btn-primary w-full">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? COPY[mode].busy : COPY[mode].button}
        </button>
      </form>
    </>
  );
}
