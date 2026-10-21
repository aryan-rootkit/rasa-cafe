"use client";

import { ArrowUpRight, Mail, Phone } from "lucide-react";
import InstagramIcon from "@/components/InstagramIcon";
import Reveal from "@/components/Reveal";
import { directionsUrl } from "@/data/site";
import { formatPhone, instagramHandle, telHref } from "@/lib/contact";
import type { WebsiteSettings } from "@/lib/content/schema";

const linkClass =
  "inline-flex min-h-10 items-center gap-2.5 text-[15px] text-ink-soft transition-colors hover:text-ink";
const labelClass = "text-[11px] tracking-[0.22em] text-muted uppercase";

export default function VisitSection({ settings }: { settings: WebsiteSettings }) {
  const { address, openingDays, openingHours, phone1, phone2, email, instagramUrl } = settings;
  const phones = [phone1, phone2].filter(Boolean);
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <section id="visit" className="section-pad border-t border-line py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal className="flex flex-col lg:col-span-5">
          <h2 className="font-serif text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-tight text-ink">
            Come by. Stay awhile.
          </h2>

          <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {(openingDays || openingHours) && (
              <div>
                <dt className={labelClass}>Hours</dt>
                <dd className="mt-3">
                  {openingDays && (
                    <p className="font-serif text-2xl text-ink md:text-3xl">{openingDays}</p>
                  )}
                  {openingHours && <p className="mt-1 text-ink-soft">{openingHours}</p>}
                </dd>
              </div>
            )}

            <div>
              <dt className={labelClass}>Location</dt>
              <dd className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink-soft">{address}</dd>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <dt className={labelClass}>Contact</dt>
              <dd className="mt-2 flex flex-wrap gap-x-8">
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
              </dd>
            </div>
          </dl>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-10 inline-flex min-h-11 items-center gap-1.5 self-start border border-ink bg-ink px-6 py-3 text-[12px] tracking-[0.16em] text-cream uppercase transition-colors hover:bg-ink-soft"
          >
            Get Directions
            <ArrowUpRight
              size={14}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden border border-line bg-cream-deep lg:aspect-auto lg:h-full lg:min-h-[440px]">
            <iframe
              src={mapSrc}
              title={`Map showing RASA at ${address}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0 grayscale-[0.35] sepia-[0.15]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
