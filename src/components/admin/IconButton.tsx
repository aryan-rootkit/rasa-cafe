"use client";

import type { ReactNode } from "react";

export default function IconButton({
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
  children: ReactNode;
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
