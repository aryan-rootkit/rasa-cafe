import { siteInfo } from "@/data/site";

const footerLinks = [
  { label: "Instagram", href: siteInfo.instagram, external: true },
  { label: "Contact", href: `mailto:${siteInfo.email}` },
  { label: "Menu", href: "#menu" },
  { label: "Order", href: "#order" },
];

export default function Footer() {
  return (
    <footer className="section-pad border-t border-line pt-20 pb-10 md:pt-28 md:pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-serif text-6xl tracking-[0.14em] text-ink md:text-7xl">
              {siteInfo.name}
            </p>
            <p className="mt-4 text-sm tracking-[0.18em] text-muted uppercase">
              {siteInfo.tagline}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="text-[13px] tracking-[0.12em] text-ink-soft uppercase transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-8 text-xs tracking-wide text-muted md:mt-20 md:flex-row md:justify-between">
          <p>© 2026 {siteInfo.name}</p>
          <p>Good food, good mood, good moments.</p>
        </div>
      </div>
    </footer>
  );
}
