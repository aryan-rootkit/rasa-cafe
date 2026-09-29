import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MenuItem from "@/components/MenuItem";
import Reveal from "@/components/Reveal";
import { getContent } from "@/lib/content/store";
import { MENU_CATEGORIES } from "@/lib/content/schema";

export const metadata: Metadata = {
  title: "Menu — RASA",
  description: "Coffee, breakfast, small plates, mains, desserts and more at RASA.",
};

export default async function MenuPage() {
  const { settings, menuItems } = await getContent();
  const visible = menuItems.filter((item) => item.isVisible);
  const categories = MENU_CATEGORIES.map((cat) => ({
    ...cat,
    items: visible.filter((item) => item.category === cat.id),
  })).filter((cat) => cat.items.length > 0);

  return (
    <main className="grain relative overflow-x-clip">
      <Navbar mapsUrl={settings.mapsUrl} instagramUrl={settings.instagramUrl} />
      <section className="section-pad pt-36 pb-24 md:pt-44 md:pb-36">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-[12px] tracking-[0.16em] text-muted uppercase transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to RASA
          </Link>
          <Reveal>
            <h1 className="mt-6 font-serif text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02] tracking-tight text-ink">
              The menu
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Everything we&apos;re cooking and pouring right now. Prices in ₹,
              inclusive of the good mood.
            </p>
          </Reveal>

          <div className="mt-16 space-y-16 md:mt-24 md:space-y-24">
            {categories.map((cat) => (
              <Reveal key={cat.id}>
                <div className="grid gap-6 border-t border-line pt-10 md:grid-cols-12 md:gap-8">
                  <h2 className="font-serif text-3xl tracking-tight text-ink md:col-span-4 md:text-4xl">
                    {cat.label}
                  </h2>
                  <ul className="md:col-span-7 md:col-start-6">
                    {cat.items.map((item) => (
                      <MenuItem key={item.id} item={item} showDescription />
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <Footer settings={settings} />
    </main>
  );
}
