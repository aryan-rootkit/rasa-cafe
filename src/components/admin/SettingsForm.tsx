"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  settingsInputSchema,
  type SettingsInput,
  type WebsiteSettings,
} from "@/lib/content/schema";
import { adminRequest } from "./api";
import Notice, { type NoticeState } from "./Notice";

type Field = {
  name: keyof SettingsInput;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
};

const FIELDS: Field[] = [
  { name: "instagramUrl", label: "Instagram URL", type: "url", placeholder: "https://www.instagram.com/…" },
  { name: "mapsUrl", label: "Google Maps URL", type: "url", placeholder: "https://…", hint: "Used for Get Directions and the map link." },
  { name: "email", label: "Email", type: "email" },
  { name: "phone1", label: "Phone 1", type: "tel" },
  { name: "phone2", label: "Phone 2", type: "tel", hint: "Optional." },
  { name: "address", label: "Address", multiline: true },
  { name: "openingDays", label: "Opening days", placeholder: "MON — SUN", hint: "Optional." },
  { name: "openingHours", label: "Opening hours", placeholder: "8:00 AM — 11:00 PM", hint: "Optional." },
];

export default function SettingsForm({ initial }: { initial: WebsiteSettings }) {
  const [values, setValues] = useState<SettingsInput>(() => ({
    instagramUrl: initial.instagramUrl,
    mapsUrl: initial.mapsUrl,
    email: initial.email,
    phone1: initial.phone1,
    phone2: initial.phone2,
    address: initial.address,
    openingDays: initial.openingDays,
    openingHours: initial.openingHours,
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof SettingsInput, string>>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const dismiss = useCallback(() => setNotice(null), []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = settingsInputSchema.safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SettingsInput;
        next[key] ??= issue.message;
      }
      setErrors(next);
      setNotice({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await adminRequest("/api/admin/settings", { method: "PUT", body: parsed.data });
      setValues(parsed.data);
      setNotice({ type: "success", message: "Changes saved successfully." });
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-8 space-y-6 rounded-xl border border-stone-200 bg-white p-5 sm:p-8"
    >
      <div className="grid gap-5 md:grid-cols-2">
        {FIELDS.map((field) => {
          const error = errors[field.name];
          const id = `setting-${field.name}`;
          const common = {
            id,
            name: field.name,
            value: values[field.name],
            placeholder: field.placeholder,
            "aria-invalid": Boolean(error),
            "aria-describedby": error ? `${id}-error` : undefined,
            className: "admin-input mt-1.5",
            onChange: (e: { target: { value: string } }) =>
              setValues((v) => ({ ...v, [field.name]: e.target.value })),
          };
          return (
            <div key={field.name} className={field.multiline ? "md:col-span-2" : undefined}>
              <label htmlFor={id} className="text-sm font-medium">
                {field.label}
              </label>
              {field.multiline ? (
                <textarea rows={2} {...common} />
              ) : (
                <input type={field.type ?? "text"} {...common} />
              )}
              {error ? (
                <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
                  {error}
                </p>
              ) : (
                field.hint && <p className="mt-1 text-xs text-stone-500">{field.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      <Notice notice={notice} onDismiss={dismiss} />

      <div className="flex justify-end border-t border-stone-100 pt-5">
        <button type="submit" disabled={saving} className="admin-btn-primary">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
