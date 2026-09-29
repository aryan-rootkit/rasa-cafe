"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/data/site";
import { cn } from "@/lib/cn";

export type ProductCardItem = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

type ProductCardProps = {
  item: ProductCardItem;
  index?: number;
  layout?: "tall" | "wide";
};

export default function ProductCard({
  item,
  index = 0,
  layout = "tall",
}: ProductCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{
        duration: 0.65,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-cream-deep",
          layout === "tall" ? "aspect-[4/5]" : "aspect-[5/4]"
        )}
      >
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] group-hover:rotate-[0.6deg]"
        />
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl tracking-tight text-ink transition-transform duration-300 group-hover:translate-x-1 md:text-[1.65rem]">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">
              {item.description}
            </p>
          )}
        </div>
        <p className="shrink-0 pt-1.5 text-sm tracking-wide text-ink">
          {formatPrice(item.price)}
        </p>
      </div>
    </motion.article>
  );
}
