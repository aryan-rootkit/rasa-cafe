"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navLinks, siteInfo } from "@/data/site";
import { cn } from "@/lib/cn";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled || open ? "py-3" : "py-5"
        )}
      >
        <div className="section-pad">
          <nav
            className={cn(
              "mx-auto flex max-w-7xl items-center justify-between rounded-full border px-5 py-3 transition-all duration-500 md:px-7",
              scrolled || open
                ? "border-line bg-cream/80 shadow-[0_8px_30px_rgba(26,24,20,0.06)] backdrop-blur-xl"
                : "border-transparent bg-transparent"
            )}
          >
            <a
              href="#home"
              className="font-serif text-2xl tracking-[0.12em] text-ink transition-opacity hover:opacity-70"
            >
              {siteInfo.name}
            </a>

            <ul className="hidden items-center gap-9 md:flex">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group relative text-[13px] tracking-[0.14em] text-ink-soft uppercase transition-colors hover:text-ink"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-300 group-hover:w-full" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <a
                href="#order"
                className="hidden items-center border border-ink/15 bg-ink px-5 py-2.5 text-[12px] tracking-[0.16em] text-cream uppercase transition-colors hover:bg-ink-soft md:inline-flex"
              >
                Order Now
              </a>
              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center text-ink md:hidden"
              >
                {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40 bg-cream/95 backdrop-blur-md md:hidden"
          >
            <div className="flex h-full flex-col justify-center gap-8 px-8 pt-16">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                  className="font-serif text-4xl tracking-wide text-ink"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#order"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mt-4 inline-flex w-fit border border-ink bg-ink px-6 py-3 text-[12px] tracking-[0.16em] text-cream uppercase"
              >
                Order Now
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
