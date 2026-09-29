"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signupInputSchema, type SignupInput } from "@/lib/content/schema";

type Errors = Partial<Record<keyof SignupInput | "confirm", string>>;

export default function SignupForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = signupInputSchema.safeParse({
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    const next: Errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof SignupInput] ??= issue.message;
      }
    }
    if (form.get("password") !== form.get("confirm")) {
      next.confirm = "Passwords don't match.";
    }
    setErrors(next);
    if (!parsed.success || next.confirm) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sign-up failed.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <Field label="Username" error={errors.username} hint="Lowercase letters, numbers, dots, dashes or underscores.">
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          maxLength={32}
          aria-invalid={Boolean(errors.username)}
          className="admin-input mt-1.5"
        />
      </Field>
      <Field label="Password" error={errors.password} hint="At least 10 characters.">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          className="admin-input mt-1.5"
        />
      </Field>
      <Field label="Confirm password" error={errors.confirm}>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirm)}
          className="admin-input mt-1.5"
        />
      </Field>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="admin-btn-primary w-full">
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>
      )}
    </label>
  );
}
