"use client";

import ProductCard, { type ProductCardItem } from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export default function TopSellers({
  items,
}: {
  items: Array<ProductCardItem & { id: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <section id="favourites" className="section-pad pb-24 md:pb-36">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-[11px] tracking-[0.22em] text-muted uppercase">
            Favourites
          </p>
          <h2 className="mt-3 font-serif text-[clamp(2.25rem,5vw,3.75rem)] tracking-tight text-ink">
            The RASA favourites
          </h2>
          <p className="mt-4 max-w-md text-[15px] text-ink-soft">
            The ones our table keeps coming back to.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
          {items.map((item, index) => (
            <ProductCard
              key={item.id}
              item={item}
              index={index}
              layout={index % 5 === 2 ? "wide" : "tall"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
