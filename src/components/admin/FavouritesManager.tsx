"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  favouriteInputSchema,
  type Favourite,
  type FavouriteInput,
} from "@/lib/content/schema";
import { ACCEPT_ATTRIBUTE } from "@/lib/upload-rules";
import { adminRequest, uploadImage } from "./api";
import IconButton from "./IconButton";
import Notice, { type NoticeState } from "./Notice";

const EMPTY: FavouriteInput = { name: "", description: "", imageUrl: "" };

const toInput = ({ name, description, imageUrl }: Favourite): FavouriteInput => ({
  name,
  description,
  imageUrl,
});

export default function FavouritesManager({ initial }: { initial: Favourite[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<{ id: string | null; values: FavouriteInput } | null>(
    null
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const dismiss = useCallback(() => setNotice(null), []);

  async function saveItem(id: string | null, values: FavouriteInput) {
    const { favourite } = id
      ? await adminRequest<{ favourite: Favourite }>(`/api/admin/favourites/${id}`, {
          method: "PUT",
          body: values,
        })
      : await adminRequest<{ favourite: Favourite }>("/api/admin/favourites", {
          method: "POST",
          body: values,
        });
    setItems((prev) => (id ? prev.map((i) => (i.id === id ? favourite : i)) : [...prev, favourite]));
  }

  async function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to || reordering) return;
    const previous = items;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setItems(next);
    setReordering(true);
    try {
      const { favourites } = await adminRequest<{ favourites: Favourite[] }>(
        "/api/admin/favourites",
        { method: "PUT", body: { order: next.map((i) => i.id) } }
      );
      setItems(favourites);
      setNotice({ type: "success", message: "New order saved." });
    } catch (err) {
      setItems(previous);
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setReordering(false);
    }
  }

  async function remove(item: Favourite) {
    if (!confirm(`Delete “${item.name}” from the RASA favourites? This can't be undone.`)) return;
    setPendingId(item.id);
    try {
      await adminRequest(`/api/admin/favourites/${item.id}`, { method: "DELETE" });
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-5 py-4">
        <p className="text-sm">
          <span className="font-semibold">{items.length}</span>{" "}
          {items.length === 1 ? "favourite" : "favourites"} on the website
          {reordering && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-stone-500">
              <Loader2 size={14} className="animate-spin" /> Saving order…
            </span>
          )}
        </p>
        <button
          type="button"
          className="admin-btn-primary"
          onClick={() => setEditing({ id: null, values: EMPTY })}
        >
          <Plus size={16} />
          Add favourite
        </button>
      </div>

      <Notice notice={notice} onDismiss={dismiss} />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-stone-500">
          No favourites yet. The section is hidden on the website until you add one.
        </div>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <FavouriteCard
              key={item.id}
              item={item}
              index={index}
              count={items.length}
              busy={pendingId === item.id}
              locked={reordering}
              dragging={dragIndex === index}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              onMove={(to) => move(index, to)}
              onEdit={() => setEditing({ id: item.id, values: toInput(item) })}
              onDelete={() => remove(item)}
            />
          ))}
        </ol>
      )}

      <p className="text-xs text-stone-500">
        Drag a card or use the arrows to change the order — it&apos;s saved straight away.
        Prices aren&apos;t shown in this section of the website.
      </p>

      {editing && (
        <FavouriteDialog
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

type FavouriteCardProps = {
  item: Favourite;
  index: number;
  count: number;
  busy: boolean;
  locked: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onMove: (to: number) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function FavouriteCard({
  item,
  index,
  count,
  busy,
  locked,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onMove,
  onEdit,
  onDelete,
}: FavouriteCardProps) {
  const [over, setOver] = useState(false);

  return (
    <li
      draggable={!locked}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onDrop();
      }}
      className={`overflow-hidden rounded-xl border bg-white transition ${
        over ? "border-stone-900 ring-2 ring-stone-900/10" : "border-stone-200"
      } ${dragging ? "opacity-40" : ""}`}
    >
      <div className="relative aspect-[4/3] bg-stone-100">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover"
        />
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold shadow-sm">
          <GripVertical size={14} className="cursor-grab text-stone-400" />
          {index + 1}
        </span>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name}</p>
          <p className="line-clamp-2 min-h-10 text-sm text-stone-500">
            {item.description || <span className="italic">No description</span>}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <IconButton
              label="Move earlier"
              disabled={index === 0 || locked}
              onClick={() => onMove(index - 1)}
            >
              <ArrowLeft size={16} />
            </IconButton>
            <IconButton
              label="Move later"
              disabled={index === count - 1 || locked}
              onClick={() => onMove(index + 1)}
            >
              <ArrowRight size={16} />
            </IconButton>
          </div>
          <div className="flex gap-1">
            <IconButton label={`Edit ${item.name}`} disabled={busy} onClick={onEdit}>
              <Pencil size={16} />
            </IconButton>
            <IconButton label={`Delete ${item.name}`} danger disabled={busy} onClick={onDelete}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        </div>
      </div>
    </li>
  );
}

function FavouriteDialog({
  initial,
  isNew,
  onClose,
  onSave,
}: {
  initial: FavouriteInput;
  isNew: boolean;
  onClose: () => void;
  onSave: (values: FavouriteInput) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FavouriteInput, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FavouriteInput>(key: K, value: FavouriteInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      set("imageUrl", await uploadImage(file, "favourite"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = favouriteInputSchema.safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof FavouriteInput] ??= issue.message;
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
        aria-labelledby="favourite-dialog-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 id="favourite-dialog-title" className="font-semibold">
            {isNew ? "Add favourite" : "Edit favourite"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 hover:bg-stone-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-5 sm:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">Photo</span>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {values.imageUrl ? "Replace photo" : "Upload photo"}
                </button>
                <span className="text-xs text-stone-500">JPG, PNG or WebP.</span>
              </div>
              {errors.imageUrl && (
                <span className="mt-1 block text-xs text-red-600">{errors.imageUrl}</span>
              )}
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

            <Field
              label="Description"
              error={errors.description}
              hint="Optional. A short line, e.g. the main ingredients."
            >
              <textarea
                rows={3}
                value={values.description}
                maxLength={200}
                onChange={(e) => set("description", e.target.value)}
                className="admin-input mt-1.5"
              />
            </Field>
          </div>

          <div>
            <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">Preview</p>
            <div className="mt-2 rounded-lg bg-cream p-3">
              <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep">
                {values.imageUrl ? (
                  <Image
                    src={values.imageUrl}
                    alt=""
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="absolute inset-0 m-auto text-stone-300" />
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="animate-spin" />
                  </div>
                )}
              </div>
              <p className="mt-3 font-serif text-lg leading-tight text-ink">
                {values.name || "Item name"}
              </p>
              {values.description && (
                <p className="mt-1 text-xs leading-relaxed text-muted">{values.description}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mx-6 mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <button type="button" onClick={onClose} className="admin-btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading} className="admin-btn-primary">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : isNew ? "Add favourite" : "Save Changes"}
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
