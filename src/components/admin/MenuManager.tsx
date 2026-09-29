"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Pencil, Plus, Star, Trash2, Upload, X } from "lucide-react";
import {
  MENU_CATEGORIES,
  menuItemInputSchema,
  type MenuCategoryId,
  type MenuItem,
  type MenuItemInput,
} from "@/lib/content/schema";
import { ACCEPT_ATTRIBUTE } from "@/lib/upload-rules";
import { adminRequest, uploadImage } from "./api";
import Notice, { type NoticeState } from "./Notice";

const EMPTY: MenuItemInput = {
  name: "",
  description: "",
  category: "coffee",
  price: 0,
  imageUrl: "",
  isVisible: true,
  isFeatured: false,
};

const toInput = ({ name, description, category, price, imageUrl, isVisible, isFeatured }: MenuItem): MenuItemInput => ({
  name,
  description,
  category,
  price,
  imageUrl,
  isVisible,
  isFeatured,
});

export default function MenuManager({ initial }: { initial: MenuItem[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<MenuCategoryId | "all">("all");
  const [editing, setEditing] = useState<{ id: string | null; values: MenuItemInput } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const dismiss = useCallback(() => setNotice(null), []);

  const groups = useMemo(
    () =>
      MENU_CATEGORIES.filter((c) => filter === "all" || c.id === filter).map((c) => ({
        ...c,
        items: items.filter((i) => i.category === c.id),
      })),
    [items, filter]
  );

  async function saveItem(id: string | null, values: MenuItemInput) {
    const { item } = id
      ? await adminRequest<{ item: MenuItem }>(`/api/admin/menu/${id}`, { method: "PUT", body: values })
      : await adminRequest<{ item: MenuItem }>("/api/admin/menu", { method: "POST", body: values });
    setItems((prev) => (id ? prev.map((i) => (i.id === id ? item : i)) : [...prev, item]));
    return item;
  }

  async function quickToggle(item: MenuItem, key: "isVisible" | "isFeatured") {
    setPendingId(item.id);
    try {
      await saveItem(item.id, { ...toInput(item), [key]: !item[key] });
      setNotice({ type: "success", message: "Changes saved successfully." });
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setPendingId(null);
    }
  }

  async function remove(item: MenuItem) {
    if (!confirm(`Delete “${item.name}” from the menu? This can't be undone.`)) return;
    setPendingId(item.id);
    try {
      await adminRequest(`/api/admin/menu/${item.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setNotice({ type: "success", message: `“${item.name}” was deleted.` });
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as MenuCategoryId | "all")}
          className="admin-input w-auto"
          aria-label="Filter by category"
        >
          <option value="all">All categories ({items.length})</option>
          {MENU_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} ({items.filter((i) => i.category === c.id).length})
            </option>
          ))}
        </select>
        <button
          type="button"
          className="admin-btn-primary"
          onClick={() =>
            setEditing({ id: null, values: { ...EMPTY, category: filter === "all" ? "coffee" : filter } })
          }
        >
          <Plus size={16} />
          Add menu item
        </button>
      </div>

      <Notice notice={notice} onDismiss={dismiss} />

      {groups.map((group) => (
        <section key={group.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <h2 className="border-b border-stone-100 bg-stone-50 px-5 py-3 text-sm font-semibold">
            {group.label}
          </h2>
          {group.items.length === 0 ? (
            <p className="px-5 py-6 text-sm text-stone-500">No items in this category yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {group.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-3 sm:flex-nowrap">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-stone-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <ImageIcon size={18} className="absolute inset-0 m-auto text-stone-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${item.isVisible ? "" : "text-stone-400 line-through"}`}>
                      {item.name}
                    </p>
                    <p className="truncate text-sm text-stone-500">
                      ₹{item.price}
                      {item.description && ` · ${item.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingId === item.id && <Loader2 size={16} className="animate-spin text-stone-400" />}
                    <button
                      type="button"
                      onClick={() => quickToggle(item, "isFeatured")}
                      disabled={pendingId === item.id}
                      title={item.isFeatured ? "Remove from favourites" : "Feature as a favourite"}
                      aria-label={item.isFeatured ? "Remove from favourites" : "Feature as a favourite"}
                      aria-pressed={item.isFeatured}
                      className={`rounded-md p-2 transition-colors hover:bg-stone-100 ${
                        item.isFeatured ? "text-amber-500" : "text-stone-300"
                      }`}
                    >
                      <Star size={16} fill={item.isFeatured ? "currentColor" : "none"} />
                    </button>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
                      <input
                        type="checkbox"
                        checked={item.isVisible}
                        disabled={pendingId === item.id}
                        onChange={() => quickToggle(item, "isVisible")}
                        className="h-4 w-4 accent-stone-900"
                      />
                      Visible
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditing({ id: item.id, values: toInput(item) })}
                      className="rounded-md p-2 text-stone-600 hover:bg-stone-100"
                      aria-label={`Edit ${item.name}`}
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      disabled={pendingId === item.id}
                      className="rounded-md p-2 text-stone-600 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Delete ${item.name}`}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {editing && (
        <MenuItemDialog
          key={editing.id ?? "new"}
          initial={editing.values}
          isNew={editing.id === null}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            await saveItem(editing.id, values);
            setEditing(null);
            setNotice({ type: "success", message: "Changes saved successfully." });
          }}
        />
      )}
    </div>
  );
}

function MenuItemDialog({
  initial,
  isNew,
  onClose,
  onSave,
}: {
  initial: MenuItemInput;
  isNew: boolean;
  onClose: () => void;
  onSave: (values: MenuItemInput) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [priceText, setPriceText] = useState(isNew ? "" : String(initial.price));
  const [errors, setErrors] = useState<Partial<Record<keyof MenuItemInput, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof MenuItemInput>(key: K, value: MenuItemInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      set("imageUrl", await uploadImage(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const candidate = { ...values, price: priceText.trim() === "" ? NaN : Number(priceText) };
    const parsed = menuItemInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof MenuItemInput] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    setError(null);
    try {
      await onSave(parsed.data);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-dialog-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 id="menu-dialog-title" className="font-semibold">
            {isNew ? "Add menu item" : "Edit menu item"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100">
              {values.imageUrl ? (
                <Image src={values.imageUrl} alt="" fill sizes="96px" className="object-cover" />
              ) : (
                <ImageIcon className="absolute inset-0 m-auto text-stone-300" />
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                className="hidden"
                onChange={(e) => {
                  onUpload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={16} />
                {values.imageUrl ? "Replace photo" : "Upload photo"}
              </button>
              {values.imageUrl && (
                <button
                  type="button"
                  className="block text-sm text-red-600 hover:underline"
                  onClick={() => set("imageUrl", "")}
                >
                  Remove photo
                </button>
              )}
              <p className="text-xs text-stone-500">JPG, PNG or WebP, up to 8 MB.</p>
            </div>
          </div>

          <Field label="Name" error={errors.name}>
            <input
              value={values.name}
              maxLength={80}
              onChange={(e) => set("name", e.target.value)}
              className="admin-input mt-1.5"
              aria-invalid={Boolean(errors.name)}
              autoFocus
            />
          </Field>

          <Field label="Description" error={errors.description} hint="Optional. Keep it short.">
            <textarea
              rows={2}
              value={values.description}
              maxLength={200}
              onChange={(e) => set("description", e.target.value)}
              className="admin-input mt-1.5"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" error={errors.category}>
              <select
                value={values.category}
                onChange={(e) => set("category", e.target.value as MenuCategoryId)}
                className="admin-input mt-1.5"
              >
                {MENU_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Price (₹)" error={errors.price}>
              <input
                inputMode="numeric"
                value={priceText}
                onChange={(e) => setPriceText(e.target.value.replace(/[^\d]/g, ""))}
                className="admin-input mt-1.5"
                aria-invalid={Boolean(errors.price)}
                placeholder="180"
              />
            </Field>
          </div>

          <div className="space-y-2 rounded-lg bg-stone-50 p-4 text-sm">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={values.isVisible}
                onChange={(e) => set("isVisible", e.target.checked)}
                className="h-4 w-4 accent-stone-900"
              />
              Visible on the website
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={values.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
                className="h-4 w-4 accent-stone-900"
              />
              Show in “The RASA favourites” (needs a photo)
            </label>
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <button type="button" onClick={onClose} className="admin-btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading} className="admin-btn-primary">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : isNew ? "Add item" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
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
