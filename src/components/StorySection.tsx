"use client";

import Image from "next/image";
import Reveal from "@/components/Reveal";

export default function StorySection() {
  return (
    <section id="story" className="relative">
      <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden md:h-[70vh]">
        <Image
          src="/images/story/cafe.jpg"
          alt="Inside RASA café"
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-ink/25" />
      </div>

      <div className="section-pad bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <h2 className="max-w-2xl font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-tight text-ink">
              Made for moments.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-ink-soft md:mt-10 md:text-lg">
              Some places are made for coffee.
              <br />
              Some are made for conversations.
              <br />
              We wanted RASA to be both.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
