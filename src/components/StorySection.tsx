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
          "section-pad bg-cream py-16 md:py-24",
          images.length === 0 && "border-t border-line"
        )}
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-4">
              <span className="text-[12px] font-medium tracking-[0.2em] text-muted uppercase">
                About Us
              </span>
            </div>
            <h2 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-tight text-ink">
              Our Story
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft md:mt-10 md:text-lg">
              <p>
                Rasa began with a simple dream to share the warmth of home through food.
              </p>
              <p>
                Born from a mother&apos;s love for cooking, creating, and bringing people together, Rasa is a space where every dish carries a little comfort and every visit feels personal. More than just a cafe, it&apos;s made for every part of your day — whether you&apos;re catching up with friends, getting some work done, lingering over a quiet coffee, or simply taking a break.
              </p>
              <p>
                Good food, comforting flavours, warm conversations, and a space you&apos;ll want to return to that&apos;s what Rasa is all about.
              </p>
            </div>
          </Reveal>

          <div className="my-12 border-t border-line/60 md:my-16" />

          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <Reveal delay={0.15}>
              <div>
                <h3 className="font-serif text-2xl text-ink md:text-3xl">
                  The Meaning of Rasa
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-soft md:text-base">
                  In Sanskrit, Rasa means flavour, or essence the very heart of an experience. That&apos;s exactly what we hope you&apos;ll carry with you not just a meal, but a feeling. We want every moment spent with Rasa Cafe to be one you truly savour and enjoy, long after the last bite.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div>
                <h3 className="font-serif text-2xl text-ink md:text-3xl">
                  The Family Behind Rasa
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-soft md:text-base">
                  Rasa is also deeply personal. At its heart, Rasa Cafe is the shared dream of Raghav and Santosh and a tribute to the whole family who stands behind it: Lavina, Raghav, Santosh, Sunita, and Deepika. Their love of food and togetherness is what gives this little home away from home its soul, and it&apos;s the same warmth we hope you feel the moment you walk in.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.25}>
            <div className="mt-14 rounded-2xl bg-cream-deep/60 p-8 text-center border border-line md:mt-20 md:p-12">
              <p className="font-serif text-2xl italic text-ink md:text-3xl">
                &ldquo;Come for the Food. Stay for the Feeling.&rdquo;
              </p>
              <p className="mt-4 text-xs font-semibold tracking-[0.25em] text-ink uppercase">
                Welcome to Rasa!
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
