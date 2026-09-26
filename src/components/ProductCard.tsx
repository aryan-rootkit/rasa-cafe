"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Product } from "@/data/types";
import { formatPrice } from "@/data/site";
import { cn } from "@/lib/cn";

type ProductCardProps = {
  product: Product;
  index?: number;
  layout?: "tall" | "wide";
};

export default function ProductCard({
  product,
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
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 90vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] group-hover:rotate-[0.6deg]"
        />
        <button
          type="button"
          aria-label={`Add ${product.name}`}
          className="absolute right-4 bottom-4 flex h-11 w-11 items-center justify-center border border-cream/30 bg-cream/90 text-ink opacity-100 backdrop-blur-sm transition-all duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <Plus size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl tracking-tight text-ink transition-transform duration-300 group-hover:translate-x-1 md:text-[1.65rem]">
            {product.name}
          </h3>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">
            {product.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="text-sm tracking-wide text-ink">{formatPrice(product.price)}</p>
          <ArrowUpRight
            size={16}
            strokeWidth={1.5}
            className="text-ink opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          />
        </div>
      </div>
    </motion.article>
  );
}
