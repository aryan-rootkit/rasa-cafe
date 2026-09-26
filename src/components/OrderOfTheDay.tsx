"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Reveal from "@/components/Reveal";
import { formatPrice, orderOfTheDay } from "@/data/site";

export default function OrderOfTheDay() {
  const item = orderOfTheDay;
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <section className="relative overflow-hidden bg-ink text-cream">
      <div className="section-pad py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden md:aspect-[5/6]">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute top-5 left-5 border border-cream/25 bg-ink/40 px-3 py-2 text-[10px] tracking-[0.2em] text-cream uppercase backdrop-blur-sm">
                {item.dateLabel ?? today}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:py-8">
            <p className="text-[11px] tracking-[0.28em] text-cream/55 uppercase">
              {item.eyebrow}
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-tight">
              {item.name}
            </h2>
            <p className="mt-3 text-sm tracking-[0.04em] text-cream/60">
              If you don&apos;t know what to pick, start here.
            </p>

            <p className="mt-8 text-[13px] tracking-[0.12em] text-cream/80 uppercase">
              {item.notes.join(" · ")}
            </p>

            <p className="mt-8 font-serif text-3xl">{formatPrice(item.price)}</p>

            <motion.a
              href="#order"
              whileHover={{ y: -1 }}
              className="mt-10 inline-flex items-center border border-cream/30 bg-cream px-7 py-3.5 text-[12px] tracking-[0.18em] text-ink uppercase transition-colors hover:bg-transparent hover:text-cream"
            >
              Order this
            </motion.a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
