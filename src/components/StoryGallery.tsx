"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import Reveal from "@/components/Reveal";
import { cn } from "@/lib/cn";

export type StoryGalleryImage = {
  id: string;
  imageUrl: string;
  altText: string;
  width: number | null;
  height: number | null;
};

/** Used for photos whose size wasn't recorded. */
const FALLBACK_RATIO = 4 / 5;
/** Widest a single photo may get on a phone, in vw, so the next one peeks in. */
const MAX_WIDTH_VW = 84;

const ratioOf = ({ width, height }: StoryGalleryImage) =>
  width && height ? width / height : FALLBACK_RATIO;

/**
 * A horizontally scrolling strip of café photos. Every photo shares the row
 * height and keeps its own shape; on narrow screens wide photos shrink rather
 * than being cropped. Scrolls natively (touch, trackpad, keyboard) with
 * arrow buttons for mouse users.
 */
export default function StoryGallery({ images }: { images: StoryGalleryImage[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false, scrollable: false });
  const reduceMotion = useReducedMotion();
  const count = images.length;

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2, scrollable: max > 2 });

    // The active photo is the one whose left edge is closest to the snap line.
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const line = el.scrollLeft + pad;
    const slides = Array.from(el.children) as HTMLElement[];
    let closest = 0;
    slides.forEach((slide, i) => {
      if (Math.abs(slide.offsetLeft - line) < Math.abs(slides[closest].offsetLeft - line)) {
        closest = i;
      }
    });
    setActive(max > 2 && el.scrollLeft >= max - 2 ? slides.length - 1 : closest);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(onScroll);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [measure]);

  const goTo = (index: number) => {
    const el = scroller.current;
    const slide = el?.children[Math.max(0, Math.min(count - 1, index))] as HTMLElement | undefined;
    if (!el || !slide) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    el.scrollTo({ left: slide.offsetLeft - pad, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <Reveal y={20} className="pt-2 md:pt-6">
      <div
        ref={scroller}
        role="region"
        aria-roledescription="carousel"
        aria-label="Photos from RASA café"
        tabIndex={0}
        className={cn(
          "no-scrollbar flex items-center gap-3 overflow-x-auto overscroll-x-contain md:gap-5",
          "snap-x snap-mandatory md:snap-proximity",
          // Start in line with the section text; the strip still runs to the right edge.
          "[--story-start:max(clamp(1.25rem,4vw,4.5rem),calc((100%-80rem)/2))]",
          "pr-[clamp(1.25rem,4vw,4.5rem)] pl-(--story-start) scroll-pl-(--story-start)",
          "[--story-h:clamp(280px,56vh,520px)] md:[--story-h:clamp(380px,70vh,780px)]",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/40"
        )}
      >
        {images.map((image, index) => {
          const ratio = ratioOf(image);
          const style: CSSProperties = {
            aspectRatio: ratio,
            height: `min(var(--story-h), ${(MAX_WIDTH_VW / ratio).toFixed(2)}vw)`,
          };
          return (
            <figure
              key={image.id}
              style={style}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              className="group relative shrink-0 snap-start overflow-hidden bg-cream-deep"
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || "A moment at RASA café"}
                fill
                loading={index < 2 ? "eager" : "lazy"}
                sizes={`(min-width: 768px) ${Math.min(90, Math.round(ratio * 70))}vw, ${MAX_WIDTH_VW}vw`}
                draggable={false}
                className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </figure>
          );
        })}
      </div>

      <div className="section-pad mt-6 md:mt-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <p className="text-[11px] tracking-[0.22em] text-muted uppercase">Inside RASA</p>

          {count > 1 && edges.scrollable && (
            <div className="flex items-center gap-4 md:gap-6">
              <p
                aria-live="polite"
                className="min-w-[3.5rem] text-[11px] tracking-[0.18em] text-muted tabular-nums"
              >
                {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </p>
              <div className="flex">
                <button
                  type="button"
                  aria-label="Previous photo"
                  disabled={edges.start}
                  onClick={() => goTo(active - 1)}
                  className="flex h-11 w-11 items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-soft"
                >
                  <ArrowLeft size={18} strokeWidth={1.25} />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  disabled={edges.end}
                  onClick={() => goTo(active + 1)}
                  className="flex h-11 w-11 items-center justify-center text-ink-soft transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-soft"
                >
                  <ArrowRight size={18} strokeWidth={1.25} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
