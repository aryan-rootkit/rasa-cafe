"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { FolderPlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  menuCategoryInputSchema,
  menuItemInputSchema,
  type MenuCategory,
  type MenuCategoryId,
  type MenuItem,
  type MenuItemInput,
} from "@/lib/content/schema";
import { adminRequest } from "./api";
import Notice, { type NoticeState } from "./Notice";

const EMPTY: MenuItemInput = {
  name: "",
  description: "",
  category: "",
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

const itemCount = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

export default function MenuManager({
  initialCategories,
  initialItems,
}: {
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<MenuCategoryId | "all">("all");
  const [editing, setEditing] = useState<{ id: string | null; values: MenuItemInput } | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | "new" | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const dismiss = useCallback(() => setNotice(null), []);

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; hidden: number }>();
    for (const item of items) {
      const entry = map.get(item.category) ?? { total: 0, hidden: 0 };
      entry.total += 1;
      if (!item.isVisible) entry.hidden += 1;
      map.set(item.category, entry);
    }
    return map;
  }, [items]);

  const groups = useMemo(
    () =>
      categories
        .filter((c) => filter === "all" || c.id === filter)
        .map((c) => ({ ...c, items: items.filter((i) => i.category === c.id) })),
    [categories, items, filter]
  );

  function startNewItem(category: MenuCategoryId) {
    setEditing({ id: null, values: { ...EMPTY, category } });
  }

  async function saveItem(id: string | null, values: MenuItemInput) {
    const { item } = id
      ? await adminRequest<{ item: MenuItem }>(`/api/admin/menu/${id}`, { method: "PUT", body: values })
      : await adminRequest<{ item: MenuItem }>("/api/admin/menu", { method: "POST", body: values });
    setItems((prev) => (id ? prev.map((i) => (i.id === id ? item : i)) : [...prev, item]));
    return item;
  }

  async function saveCategory(target: MenuCategory | "new", label: string) {
    if (target === "new") {
      const { category } = await adminRequest<{ category: MenuCategory }>("/api/admin/menu-categories", {
        method: "POST",
        body: { label },
      });
      setCategories((prev) => [...prev, category]);
      setFilter(category.id);
      setNotice({ type: "success", message: `“${category.label}” was added. You can add items to it now.` });
    } else {
      const { category } = await adminRequest<{ category: MenuCategory }>(
        `/api/admin/menu-categories/${target.id}`,
        { method: "PUT", body: { label } }
      );
      setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
      setNotice({ type: "success", message: "Category renamed." });
    }
    setEditingCategory(null);
  }

  async function removeCategory(category: MenuCategory) {
    if (!confirm(`Delete the “${category.label}” category?`)) return;
    setPendingId(category.id);
    try {
      await adminRequest(`/api/admin/menu-categories/${category.id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      if (filter === category.id) setFilter("all");
      setNotice({ type: "success", message: `“${category.label}” was deleted.` });
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setPendingId(null);
    }
  }

  async function quickToggle(item: MenuItem, key: "isVisible") {
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

  const hiddenTotal = items.filter((i) => !i.isVisible).length;

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-stone-700">Categories</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-btn-secondary" onClick={() => setEditingCategory("new")}>
            <FolderPlus size={16} />
            Add category
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            disabled={categories.length === 0}
            onClick={() => startNewItem(filter === "all" ? categories[0].id : filter)}
          >
            <Plus size={16} />
            Add menu item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <CategoryCard
          label="All items"
          total={items.length}
          hidden={hiddenTotal}
          selected={filter === "all"}
          onSelect={() => setFilter("all")}
        />
        {categories.map((category) => {
          const count = counts.get(category.id) ?? { total: 0, hidden: 0 };
          return (
            <CategoryCard
              key={category.id}
              label={category.label}
              total={count.total}
              hidden={count.hidden}
              selected={filter === category.id}
              busy={pendingId === category.id}
              onSelect={() => setFilter(category.id)}
              onRename={() => setEditingCategory(category)}
              onDelete={count.total === 0 ? () => removeCategory(category) : undefined}
            />
          );
        })}
        <button
          type="button"
          onClick={() => setEditingCategory("new")}
          className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 text-sm font-medium text-stone-500 transition-colors hover:border-stone-500 hover:text-stone-800"
        >
          <Plus size={18} />
          Add category
        </button>
      </div>

      <Notice notice={notice} onDismiss={dismiss} />

      {categories.length === 0 && (
        <p className="rounded-xl border border-stone-200 bg-white px-5 py-6 text-sm text-stone-500">
          Add a category first, then add menu items to it.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-stone-50 px-5 py-2">
            <h2 className="text-sm font-semibold">{group.label}</h2>
            <button
              type="button"
              onClick={() => startNewItem(group.id)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <Plus size={14} />
              Add item
            </button>
          </div>
          {group.items.length === 0 ? (
            <p className="px-5 py-6 text-sm text-stone-500">No items in this category yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {group.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-3 sm:flex-nowrap">
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
          categories={categories}
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

      {editingCategory && (
        <CategoryDialog
          key={editingCategory === "new" ? "new" : editingCategory.id}
          initial={editingCategory === "new" ? "" : editingCategory.label}
          isNew={editingCategory === "new"}
          onClose={() => setEditingCategory(null)}
          onSave={(label) => saveCategory(editingCategory, label)}
        />
      )}
    </div>
  );
}

function CategoryCard({
  label,
  total,
  hidden,
  selected,
  busy,
  onSelect,
  onRename,
  onDelete,
}: {
  label: string;
  total: number;
  hidden: number;
  selected: boolean;
  busy?: boolean;
  onSelect: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border bg-white transition-colors ${
        selected ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-400"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="block min-h-[104px] w-full rounded-xl p-4 pr-16 text-left"
      >
        <span className="block truncate text-sm font-medium text-stone-500">{label}</span>
        <span className="mt-1 block text-2xl font-semibold">{itemCount(total)}</span>
        <span className="mt-0.5 block text-xs text-stone-500">
          {total === 0 ? "No items yet" : hidden > 0 ? `${hidden} hidden` : "All visible"}
        </span>
      </button>
      {(onRename || onDelete || busy) && (
        <div className="absolute top-2 right-2 flex items-center">
          {busy && <Loader2 size={14} className="m-1.5 animate-spin text-stone-400" />}
          {onRename && (
            <button
              type="button"
              onClick={onRename}
              className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              aria-label={`Rename ${label}`}
              title="Rename"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="rounded-md p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700"
              aria-label={`Delete ${label}`}
              title="Delete (only empty categories)"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryDialog({
  initial,
  isNew,
  onClose,
  onSave,
}: {
  initial: string;
  isNew: boolean;
  onClose: () => void;
  onSave: (label: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = menuCategoryInputSchema.safeParse({ label });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(parsed.data.label);
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
        aria-labelledby="category-dialog-title"
        className="w-full max-w-sm rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 id="category-dialog-title" className="font-semibold">
            {isNew ? "Add category" : "Rename category"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <Field label="Category name" error={error ?? undefined} hint="Shown as a heading on the website menu.">
            <input
              value={label}
              maxLength={40}
              onChange={(e) => setLabel(e.target.value)}
              className="admin-input mt-1.5"
              aria-invalid={Boolean(error)}
              placeholder="e.g. Sandwiches"
              autoFocus
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <button type="button" onClick={onClose} className="admin-btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="admin-btn-primary">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : isNew ? "Add category" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MenuItemDialog({
  categories,
  initial,
  isNew,
  onClose,
  onSave,
}: {
  categories: MenuCategory[];
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

  const set = <K extends keyof MenuItemInput>(key: K, value: MenuItemInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

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
                {categories.map((c) => (
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
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <button type="button" onClick={onClose} className="admin-btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="admin-btn-primary">
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
