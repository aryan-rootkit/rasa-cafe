"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import {
  HERO_IMAGE_LIMIT,
  firstIssue,
  heroImagesInputSchema,
  type HeroImage,
} from "@/lib/content/schema";
import { ACCEPT_ATTRIBUTE } from "@/lib/upload-rules";
import { adminRequest, uploadImage } from "./api";
import Notice, { type NoticeState } from "./Notice";

type Row = {
  key: string;
  id?: string;
  imageUrl: string;
  altText: string;
  isActive: boolean;
};

const toRows = (images: HeroImage[]): Row[] =>
  images.map(({ id, imageUrl, altText, isActive }) => ({
    key: id,
    id,
    imageUrl,
    altText,
    isActive,
  }));

export default function HeroManager({ initial }: { initial: HeroImage[] }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const dismiss = useCallback(() => setNotice(null), []);
  const addInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (next: Row[]) => {
    setRows(next);
    setDirty(true);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update(next);
  };

  async function handleUpload(file: File | undefined, replaceKey?: string) {
    if (!file) return;
    const busy = replaceKey ?? "new";
    setBusyKey(busy);
    setNotice(null);
    try {
      const url = await uploadImage(file);
      if (replaceKey) {
        update(rows.map((r) => (r.key === replaceKey ? { ...r, imageUrl: url } : r)));
      } else {
        update([
          ...rows,
          { key: crypto.randomUUID(), imageUrl: url, altText: "RASA Café", isActive: true },
        ]);
      }
      setNotice({
        type: "success",
        message: "Image uploaded successfully. Save changes to publish it.",
      });
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setBusyKey(null);
    }
  }

  async function save() {
    const payload = rows.map(({ id, imageUrl, altText, isActive }) => ({
      id,
      imageUrl,
      altText,
      isActive,
    }));
    const parsed = heroImagesInputSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const index = typeof issue?.path[0] === "number" ? issue.path[0] : null;
      setNotice({
        type: "error",
        message: index !== null ? `Image ${index + 1}: ${issue.message}` : firstIssue(parsed.error),
      });
      return;
    }

    setSaving(true);
    try {
      const { images } = await adminRequest<{ images: HeroImage[] }>("/api/admin/hero", {
        method: "PUT",
        body: { images: parsed.data },
      });
      setRows(toRows(images));
      setDirty(false);
      setNotice({ type: "success", message: "Changes saved successfully." });
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const activeCount = rows.filter((r) => r.isActive).length;
  const full = rows.length >= HERO_IMAGE_LIMIT;

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-5 py-4">
        <p className="text-sm">
          <span className="font-semibold">{activeCount}</span> of {HERO_IMAGE_LIMIT} showing
          {activeCount < HERO_IMAGE_LIMIT && (
            <span className="text-amber-700">
              {" "}· add {HERO_IMAGE_LIMIT - activeCount} more for the full gallery
            </span>
          )}
          {dirty && <span className="ml-2 text-stone-500">· Unsaved changes</span>}
        </p>
        <div className="flex gap-2">
          <input
            ref={addInput}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={(e) => {
              handleUpload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => addInput.current?.click()}
            disabled={full || busyKey !== null}
            className="admin-btn-secondary"
            title={full ? `Maximum of ${HERO_IMAGE_LIMIT} images` : undefined}
          >
            {busyKey === "new" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Upload Image
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving || busyKey !== null}
            className="admin-btn-primary"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <Notice notice={notice} onDismiss={dismiss} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-stone-500">
          No hero images yet. Upload up to {HERO_IMAGE_LIMIT} JPG, PNG or WebP images (max 8 MB each).
        </div>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, index) => (
            <HeroCard
              key={row.key}
              row={row}
              index={index}
              count={rows.length}
              busy={busyKey === row.key}
              dragging={dragIndex === index}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              onMove={(to) => move(index, to)}
              onChange={(patch) =>
                update(rows.map((r) => (r.key === row.key ? { ...r, ...patch } : r)))
              }
              onReplace={(file) => handleUpload(file, row.key)}
              onDelete={() => {
                if (confirm(`Remove image ${index + 1}? It will disappear from the site when you save.`)) {
                  update(rows.filter((r) => r.key !== row.key));
                }
              }}
            />
          ))}
        </ol>
      )}

      <p className="text-xs text-stone-500">
        JPG, PNG or WebP, up to 8 MB. Images are resized and compressed automatically.
        Landscape and portrait both work — the gallery crops to fit.
      </p>
    </div>
  );
}

type HeroCardProps = {
  row: Row;
  index: number;
  count: number;
  busy: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onMove: (to: number) => void;
  onChange: (patch: Partial<Row>) => void;
  onReplace: (file: File | undefined) => void;
  onDelete: () => void;
};

function HeroCard({
  row,
  index,
  count,
  busy,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onMove,
  onChange,
  onReplace,
  onDelete,
}: HeroCardProps) {
  const replaceInput = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const altId = `alt-${row.key}`;

  return (
    <li
      draggable
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
          src={row.imageUrl}
          alt={row.altText}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className={`object-cover ${row.isActive ? "" : "opacity-40 grayscale"}`}
        />
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold shadow-sm">
          <GripVertical size={14} className="cursor-grab text-stone-400" />
          {index + 1}
        </span>
        {!row.isActive && (
          <span className="absolute top-2 right-2 rounded-md bg-stone-900/80 px-2 py-1 text-xs text-white">
            Hidden
          </span>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <label htmlFor={altId} className="text-xs font-medium text-stone-600">
            Alt text
          </label>
          <input
            id={altId}
            value={row.altText}
            maxLength={160}
            onChange={(e) => onChange({ altText: e.target.value })}
            className="admin-input mt-1"
            aria-invalid={row.altText.trim().length < 3}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <IconButton label="Move earlier" disabled={index === 0} onClick={() => onMove(index - 1)}>
              <ArrowLeft size={16} />
            </IconButton>
            <IconButton label="Move later" disabled={index === count - 1} onClick={() => onMove(index + 1)}>
              <ArrowRight size={16} />
            </IconButton>
            <IconButton
              label={row.isActive ? "Hide from website" : "Show on website"}
              onClick={() => onChange({ isActive: !row.isActive })}
            >
              {row.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
            </IconButton>
          </div>
          <div className="flex gap-1">
            <input
              ref={replaceInput}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              className="hidden"
              onChange={(e) => {
                onReplace(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <IconButton label="Replace image" disabled={busy} onClick={() => replaceInput.current?.click()}>
              <RefreshCw size={16} />
            </IconButton>
            <IconButton label="Delete image" danger onClick={onDelete}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        </div>
      </div>
    </li>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border border-stone-200 p-2 text-stone-600 transition-colors disabled:opacity-30 ${
        danger ? "hover:border-red-200 hover:bg-red-50 hover:text-red-700" : "hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}
