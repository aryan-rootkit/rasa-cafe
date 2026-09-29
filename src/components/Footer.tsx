import { brand } from "@/data/site";
import type { WebsiteSettings } from "@/lib/content/schema";

export default function Footer({ settings }: { settings: WebsiteSettings }) {
  const links = [
    { label: "Instagram", href: settings.instagramUrl, external: true },
    { label: "Email", href: `mailto:${settings.email}` },
    { label: "Menu", href: "/menu" },
    { label: "Directions", href: settings.mapsUrl, external: true },
  ];

  return (
    <footer className="section-pad border-t border-line pt-20 pb-10 md:pt-28 md:pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-serif text-6xl tracking-[0.14em] text-ink md:text-7xl">
              {brand.name}
            </p>
            <p className="mt-4 text-sm tracking-[0.18em] text-muted uppercase">
              {brand.tagline}
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex min-h-11 items-center text-[13px] tracking-[0.12em] text-ink-soft uppercase transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-8 text-xs tracking-wide text-muted md:mt-20 md:flex-row md:justify-between">
          <p>© 2026 {brand.name}</p>
          <p>{settings.address}</p>
        </div>
      </div>
    </footer>
  );
}
