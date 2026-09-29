"use client";

import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import InstagramIcon from "@/components/InstagramIcon";
import Reveal from "@/components/Reveal";
import { formatPhone, instagramHandle, telHref } from "@/lib/contact";
import type { WebsiteSettings } from "@/lib/content/schema";

const linkClass =
  "inline-flex min-h-11 items-center gap-2.5 text-[15px] text-ink-soft transition-colors hover:text-ink";

export default function VisitSection({ settings }: { settings: WebsiteSettings }) {
  const { address, openingDays, openingHours, phone1, phone2, email, instagramUrl, mapsUrl } =
    settings;
  const phones = [phone1, phone2].filter(Boolean);

  return (
    <section id="visit" className="section-pad border-t border-line py-24 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <h2 className="font-serif text-[clamp(2.25rem,5vw,3.75rem)] tracking-tight text-ink">
            Come by. Stay awhile.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="space-y-12">
            {(openingDays || openingHours) && (
              <div>
                <p className="text-[11px] tracking-[0.22em] text-muted uppercase">
                  Hours
                </p>
                {openingDays && (
                  <p className="mt-3 font-serif text-3xl text-ink md:text-4xl">
                    {openingDays}
                  </p>
                )}
                {openingHours && <p className="mt-2 text-ink-soft">{openingHours}</p>}
              </div>
            )}

            <div>
              <p className="text-[11px] tracking-[0.22em] text-muted uppercase">
                Location
              </p>
              <p className="mt-3 flex max-w-sm items-start gap-2.5 text-[15px] leading-relaxed text-ink-soft">
                <MapPin size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <span>{address}</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] tracking-[0.22em] text-muted uppercase">
                Contact
              </p>
              <div className="mt-2 flex flex-col">
                {phones.map((phone) => (
                  <a key={phone} href={telHref(phone)} className={linkClass}>
                    <Phone size={16} strokeWidth={1.5} />
                    {formatPhone(phone)}
                  </a>
                ))}
                <a href={`mailto:${email}`} className={linkClass}>
                  <Mail size={16} strokeWidth={1.5} />
                  {email}
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <InstagramIcon size={16} />
                  {instagramHandle(instagramUrl)}
                </a>
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-11 items-center gap-2 text-[13px] tracking-[0.14em] text-ink uppercase transition-opacity hover:opacity-70"
            >
              Get Directions
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Placeholder until a Google Maps embed is configured. */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open RASA's location in Google Maps"
              className="group relative flex aspect-[4/3] items-end overflow-hidden border border-line bg-cream-deep p-8 md:aspect-auto md:h-full md:min-h-[420px]"
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.35] transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
              />
              <span
                aria-hidden
                className="absolute top-1/2 left-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              >
                <span className="absolute h-full w-full animate-ping rounded-full bg-accent/30 [animation-duration:2.4s]" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              <div className="relative z-10 max-w-xs">
                <p className="font-serif text-2xl text-ink">Find us here</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{address}</p>
                <p className="mt-5 inline-flex items-center gap-1.5 text-[12px] tracking-[0.14em] text-ink uppercase">
                  Open in Google Maps
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </p>
              </div>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
