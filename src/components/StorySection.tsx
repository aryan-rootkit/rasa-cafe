"use client";

import Reveal from "@/components/Reveal";
import StoryGallery, { type StoryGalleryImage } from "@/components/StoryGallery";
import { cn } from "@/lib/cn";

export default function StorySection({ images }: { images: StoryGalleryImage[] }) {
  return (
    <section id="story" className="relative">
      {/* With no gallery photos yet, the section is just the story text. */}
      {images.length > 0 && <StoryGallery images={images} />}

      <div
        className={cn(
          "section-pad bg-cream py-14 md:py-20",
          images.length === 0 && "border-t border-line"
        )}
      >
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
