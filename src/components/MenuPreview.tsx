"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MenuItem from "@/components/MenuItem";
import Reveal from "@/components/Reveal";
import { menuCategories } from "@/data/site";
import { cn } from "@/lib/cn";

export default function MenuPreview() {
  const [active, setActive] = useState(menuCategories[0].id);
  const category =
    menuCategories.find((c) => c.id === active) ?? menuCategories[0];

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

        <div className="mt-12 flex gap-2 overflow-x-auto pb-2 no-scrollbar md:mt-16 md:flex-wrap md:gap-3">
          {menuCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(cat.id)}
              className={cn(
                "shrink-0 border px-4 py-2 text-[11px] tracking-[0.16em] uppercase transition-colors duration-300",
                active === cat.id
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
              A curated taste of what we serve — full menu available in café and
              soon online.
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
                {category.items.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </motion.ul>
            </AnimatePresence>

            <a
              href="#menu"
              className="mt-10 inline-flex items-center gap-2 text-[13px] tracking-[0.14em] text-ink uppercase transition-opacity hover:opacity-70"
            >
              View Full Menu
              <ArrowRight size={16} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
