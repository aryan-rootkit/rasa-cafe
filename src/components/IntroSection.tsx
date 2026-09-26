"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { siteInfo } from "@/data/site";
import Reveal from "@/components/Reveal";

export default function IntroSection() {
  return (
    <section className="section-pad relative py-24 md:py-36">
      <div className="mx-auto grid max-w-7xl gap-12 border-t border-line pt-16 md:grid-cols-12 md:gap-8 md:pt-24">
        <Reveal className="md:col-span-7">
          <h2 className="font-serif text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.05] tracking-tight text-ink">
            A little place with
            <br />
            a lot of rasa.
          </h2>
        </Reveal>

        <Reveal delay={0.12} className="flex flex-col justify-end md:col-span-5 md:pl-8">
          <p className="max-w-sm text-[15px] leading-relaxed text-ink-soft md:text-base">
            {siteInfo.description}
          </p>
          <motion.a
            href="#story"
            whileHover={{ x: 4 }}
            className="mt-8 inline-flex items-center gap-2 text-[13px] tracking-[0.14em] text-ink uppercase transition-opacity hover:opacity-70"
          >
            Discover RASA
            <ArrowRight size={16} strokeWidth={1.5} />
          </motion.a>
        </Reveal>
      </div>
    </section>
  );
}
