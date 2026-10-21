import Link from "next/link";
import { brand, navLinks } from "@/data/site";

/** Contact details live in the Visit section; the footer only signs off and links around the site. */
export default function Footer() {
  return (
    <footer className="section-pad border-t border-line py-10 md:py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-baseline gap-4">
          <p className="font-serif text-3xl tracking-[0.14em] text-ink">{brand.name}</p>
          <p className="text-[11px] tracking-[0.18em] text-muted uppercase">{brand.tagline}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-[12px] tracking-[0.14em] text-ink-soft uppercase transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs tracking-wide text-muted">© 2026 {brand.name}</p>
      </div>
    </footer>
  );
}
