"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { firstIssue, storyImagesInputSchema, type StoryImage } from "@/lib/content/schema";
import { ACCEPT_ATTRIBUTE } from "@/lib/upload-rules";
import { adminRequest, uploadImage } from "./api";
import IconButton from "./IconButton";
import Notice, { type NoticeState } from "./Notice";

type Row = {
  key: string;
  id?: string;
  imageUrl: string;
  altText: string;
  /** Not saved yet: shown with a "Preview" badge until published. */
  isNew?: boolean;
};

const toRows = (images: StoryImage[]): Row[] =>
  images.map(({ id, imageUrl, altText }) => ({ key: id, id, imageUrl, altText }));

export default function StoryGalleryManager({ initial }: { initial: StoryImage[] }) {
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

  async function handleUpload(files: File[], replaceKey?: string) {
    if (files.length === 0) return;
    setBusyKey(replaceKey ?? "new");
    setNotice(null);
    let next = rows;
    let uploaded = 0;
    try {
      for (const file of files) {
        const url = await uploadImage(file, "story");
        next = replaceKey
          ? next.map((r) => (r.key === replaceKey ? { ...r, imageUrl: url, isNew: true } : r))
          : [...next, { key: crypto.randomUUID(), imageUrl: url, altText: "", isNew: true }];
        uploaded++;
      }
      setNotice({
        type: "success",
        message: `${uploaded === 1 ? "Image" : `${uploaded} images`} uploaded. Check the preview, then save changes to publish.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        message: uploaded
          ? `${uploaded} uploaded, then: ${(err as Error).message}`
          : (err as Error).message,
      });
    } finally {
      if (uploaded) update(next);
      setBusyKey(null);
    }
  }

  async function save() {
    const payload = rows.map(({ id, imageUrl, altText }) => ({ id, imageUrl, altText }));
    const parsed = storyImagesInputSchema.safeParse(payload);
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
      const { images } = await adminRequest<{ images: StoryImage[] }>("/api/admin/story", {
        method: "PUT",
        body: { images: parsed.data },
      });
      setRows(toRows(images));
      setDirty(false);
      setNotice({ type: "success", message: "Gallery published to the website." });
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-5 py-4">
        <p className="text-sm">
          <span className="font-semibold">{rows.length}</span>{" "}
          {rows.length === 1 ? "photo" : "photos"} in the gallery
          {dirty && <span className="ml-2 text-stone-500">· Unsaved changes</span>}
        </p>
        <div className="flex gap-2">
          <input
            ref={addInput}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            multiple
            className="hidden"
            onChange={(e) => {
              handleUpload(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => addInput.current?.click()}
            disabled={busyKey !== null}
            className="admin-btn-secondary"
          >
            {busyKey === "new" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload Images
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
          No gallery photos yet. Until you add some, Our Story shows the single café photo it
          has today. Upload JPG, PNG or WebP photos of the café, the people and the food.
        </div>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, index) => (
            <StoryCard
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
              onReplace={(file) => file && handleUpload([file], row.key)}
              onDelete={() => {
                if (
                  confirm(
                    `Remove photo ${index + 1}? It will disappear from the website when you save.`
                  )
                ) {
                  update(rows.filter((r) => r.key !== row.key));
                }
              }}
            />
          ))}
        </ol>
      )}

      <p className="text-xs text-stone-500">
        JPG, PNG or WebP, up to 25 MB each — large photos are resized and compressed
        automatically. The website keeps each photo&apos;s shape, so landscape and portrait
        shots can sit side by side. There&apos;s no limit on how many you add.
      </p>
    </div>
  );
}

type StoryCardProps = {
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

function StoryCard({
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
}: StoryCardProps) {
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
          className="object-contain"
        />
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold shadow-sm">
          <GripVertical size={14} className="cursor-grab text-stone-400" />
          {index + 1}
        </span>
        {row.isNew && (
          <span className="absolute top-2 right-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            Preview · not published
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
            Alt text <span className="font-normal text-stone-400">(optional, for screen readers)</span>
          </label>
          <input
            id={altId}
            value={row.altText}
            maxLength={160}
            placeholder="e.g. Friends sharing coffee by the window"
            onChange={(e) => onChange({ altText: e.target.value })}
            className="admin-input mt-1"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <IconButton label="Move earlier" disabled={index === 0} onClick={() => onMove(index - 1)}>
              <ArrowLeft size={16} />
            </IconButton>
            <IconButton
              label="Move later"
              disabled={index === count - 1}
              onClick={() => onMove(index + 1)}
            >
              <ArrowRight size={16} />
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
            <IconButton
              label="Replace image"
              disabled={busy}
              onClick={() => replaceInput.current?.click()}
            >
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
