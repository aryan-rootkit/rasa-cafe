"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MenuItem, { type MenuRowItem } from "@/components/MenuItem";
import Reveal from "@/components/Reveal";
import { MENU_CATEGORIES, type MenuCategoryId } from "@/lib/content/categories";
import { cn } from "@/lib/cn";

const PREVIEW_LIMIT = 5;

type PreviewItem = MenuRowItem & { id: string; category: MenuCategoryId };

export default function MenuPreview({ items }: { items: PreviewItem[] }) {
  const categories = MENU_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category === cat.id),
  })).filter((cat) => cat.items.length > 0);

  const [activeId, setActiveId] = useState<MenuCategoryId | undefined>(
    categories[0]?.id
  );
  const category = categories.find((c) => c.id === activeId) ?? categories[0];

  if (!category) return null;

  return (
    <section id="menu" className="section-pad py-24 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-[11px] tracking-[0.22em] text-muted uppercase">
            Menu
          </p>
          <h2 className="mt-3 font-serif text-[clamp(2.25rem,5vw,3.75rem)] tracking-tight text-ink">
            What&apos;s on the table
          </h2>
        </Reveal>

        <div className="no-scrollbar mt-12 flex gap-2 overflow-x-auto pb-2 md:mt-16 md:flex-wrap md:gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveId(cat.id)}
              aria-pressed={category.id === cat.id}
              className={cn(
                "min-h-10 shrink-0 border px-4 py-2 text-[11px] tracking-[0.16em] uppercase transition-colors duration-300",
                category.id === cat.id
                  ? "border-ink bg-ink text-cream"
                  : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-12 border-t border-line pt-10 md:mt-14 md:grid-cols-12 md:gap-8 md:pt-14">
          <Reveal className="md:col-span-4">
            <p className="font-serif text-4xl tracking-tight text-ink md:text-5xl">
              {category.label}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              A curated taste of what we serve. Come in for the full table.
            </p>
          </Reveal>

          <div className="md:col-span-7 md:col-start-6">
            <AnimatePresence mode="wait">
              <motion.ul
                key={category.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {category.items.slice(0, PREVIEW_LIMIT).map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </motion.ul>
            </AnimatePresence>

            <Link
              href="/menu"
              className="group mt-10 inline-flex min-h-11 items-center gap-2 text-[13px] tracking-[0.14em] text-ink uppercase transition-opacity hover:opacity-70"
            >
              View Full Menu
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
