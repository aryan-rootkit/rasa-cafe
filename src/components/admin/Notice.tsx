"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type NoticeState = { type: "success" | "error"; message: string } | null;

export default function Notice({
  notice,
  onDismiss,
}: {
  notice: NoticeState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (notice?.type !== "success") return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) return null;
  const success = notice.type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {success ? (
        <CheckCircle2 size={18} className="mt-px shrink-0" />
      ) : (
        <AlertCircle size={18} className="mt-px shrink-0" />
      )}
      <p className="flex-1">{notice.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-m-1 rounded p-1 opacity-60 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}
