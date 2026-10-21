"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export type ProductCardItem = {
  name: string;
  description: string;
  imageUrl: string;
};

type ProductCardProps = {
  item: ProductCardItem;
  index?: number;
};

export default function ProductCard({
  item,
  index = 0,
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
      {/* Every card shares one shape so the grid stays even. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] group-hover:rotate-[0.6deg]"
        />
      </div>

      <div className="mt-5">
        <h3 className="font-serif text-2xl tracking-tight text-ink transition-transform duration-300 group-hover:translate-x-1 md:text-[1.65rem]">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted">
            {item.description}
          </p>
        )}
      </div>
    </motion.article>
  );
}
