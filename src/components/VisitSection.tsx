"use client";

import { ArrowRight, MapPin, Phone } from "lucide-react";
import Reveal from "@/components/Reveal";
import { siteInfo } from "@/data/site";

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function VisitSection() {
  const { address, hours, phone, instagram, mapsUrl } = siteInfo;

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
            <div>
              <p className="text-[11px] tracking-[0.22em] text-muted uppercase">
                Hours
              </p>
              <p className="mt-3 font-serif text-3xl text-ink md:text-4xl">
                {hours.days}
              </p>
              <p className="mt-2 text-ink-soft">{hours.time}</p>
            </div>

            <div>
              <p className="text-[11px] tracking-[0.22em] text-muted uppercase">
                Location
              </p>
              <p className="mt-3 flex items-start gap-2 text-[15px] leading-relaxed text-ink-soft">
                <MapPin size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                <span>
                  {address.line1}
                  <br />
                  {address.line2}
                  <br />
                  {address.city}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                <Phone size={16} strokeWidth={1.5} />
                {phone}
              </a>
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                <InstagramIcon size={16} />
                @rasacafe
              </a>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[13px] tracking-[0.14em] text-ink uppercase transition-opacity hover:opacity-70"
            >
              Get Directions
              <ArrowRight size={16} strokeWidth={1.5} />
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            {/* Placeholder map — swap iframe src for Google Maps embed later */}
            <div className="relative flex aspect-[4/3] items-end overflow-hidden border border-line bg-cream-deep p-8 md:aspect-auto md:min-h-[420px]">
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
              />
              <div className="relative z-10 max-w-xs">
                <p className="font-serif text-2xl text-ink">Find us here</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Lavelle Road, Bengaluru — a quiet corner for coffee, food and
                  unhurried time.
                </p>
                <div className="mt-6 h-3 w-3 rounded-full bg-accent" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
