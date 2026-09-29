"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { brand } from "@/data/site";
import { cn } from "@/lib/cn";

export type HeroGalleryImage = {
  id: string;
  imageUrl: string;
  altText: string;
};

const ADVANCE_EVERY_MS = 2000;
const RESUME_AFTER_INTERACTION_MS = 4000;
const GLIDE = { duration: 1.3, ease: [0.65, 0, 0.35, 1] as const };

const OFFSETS = ["md:mt-0", "md:mt-16", "md:mt-6", "md:mt-24", "md:mt-10"];
const RATIOS = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[5/6]",
  "aspect-[3/4]",
];

const wrap = (value: number, length: number) =>
  ((value % length) + length) % length;

export default function HeroGallery({ images }: { images: HeroGalleryImage[] }) {
  const count = images.length;
  const loops = count > 1;
  // Three copies let the strip glide forever: we always sit in the middle copy
  // and silently jump back by one copy-width once a glide finishes.
  const slides = loops ? [...images, ...images, ...images] : images;
  const startSlot = loops ? count : 0;

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const step = useMotionValue(0);
  const index = useRef(startSlot);
  const glide = useRef<AnimationPlaybackControls | null>(null);
  const dragging = useRef(false);
  const holdUntil = useRef(0);
  const lastWheel = useRef(0);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(true);
  const reduceMotion = useReducedMotion();

  const recentre = useCallback(() => {
    if (!loops) return;
    let i = index.current;
    if (i >= count * 2) i -= count;
    else if (i < count) i += count;
    if (i !== index.current) {
      index.current = i;
      x.set(-i * step.get());
    }
  }, [count, loops, step, x]);

  const goTo = useCallback(
    (target: number) => {
      if (count === 0) return;
      const i = Math.max(0, Math.min(slides.length - 1, target));
      index.current = i;
      setActive(wrap(i, count));
      glide.current?.stop();
      glide.current = animate(x, -i * step.get(), {
        ...GLIDE,
        onComplete: recentre,
      });
    },
    [count, recentre, slides.length, step, x]
  );

  const nudge = useCallback(
    (delta: number) => {
      holdUntil.current = Date.now() + RESUME_AFTER_INTERACTION_MS;
      goTo(index.current + delta);
    },
    [goTo]
  );

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const first = track.firstElementChild as HTMLElement | null;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const size = first.offsetWidth + gap;
      step.set(size);
      glide.current?.stop();
      x.set(-index.current * size);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [step, x]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!loops || reduceMotion || !inView) return;
    const timer = setInterval(() => {
      if (dragging.current || document.hidden) return;
      if (Date.now() < holdUntil.current) return;
      goTo(index.current + 1);
    }, ADVANCE_EVERY_MS);
    return () => clearInterval(timer);
  }, [goTo, inView, loops, reduceMotion]);

  useEffect(() => () => glide.current?.stop(), []);

  const onDragStart = () => {
    dragging.current = true;
    glide.current?.stop();
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    dragging.current = false;
    holdUntil.current = Date.now() + RESUME_AFTER_INTERACTION_MS;
    const size = step.get() || 1;
    const projected = x.get() + info.velocity.x * 0.25;
    goTo(Math.round(-projected / size));
  };

  // Horizontal trackpad swipes only; vertical wheel keeps scrolling the page.
  const onWheel = (e: ReactWheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) {
      return;
    }
    const now = Date.now();
    if (now - lastWheel.current < 700) return;
    lastWheel.current = now;
    nudge(e.deltaX > 0 ? 1 : -1);
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Food and café moments at RASA"
      className="relative overflow-hidden pt-28 md:pt-32"
    >
      <div className="section-pad relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 max-w-xl md:mb-14"
        >
          <h1 className="font-serif text-5xl tracking-[0.18em] text-ink md:text-6xl">
            {brand.name}
          </h1>
          <p className="mt-3 text-sm tracking-[0.22em] text-muted uppercase md:text-[13px]">
            {brand.tagline}
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft md:text-base">
            {brand.heroLine}
          </p>
        </motion.div>
      </div>

      {count > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="pl-[clamp(1.25rem,4vw,4.5rem)]"
            onWheel={onWheel}
          >
            <motion.div
              ref={trackRef}
              drag={loops ? "x" : false}
              dragMomentum={false}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              style={{ x }}
              className={cn(
                "flex items-start gap-4 select-none md:gap-6",
                loops && "cursor-grab active:cursor-grabbing"
              )}
            >
              {slides.map((image, slot) => (
                <Slide
                  key={`${image.id}-${slot}`}
                  image={image}
                  slot={slot}
                  number={wrap(slot, count)}
                  total={count}
                  x={x}
                  step={step}
                  eager={slot % count < 3}
                  lead={slot === startSlot}
                  hidden={loops && (slot < count || slot >= count * 2)}
                />
              ))}
            </motion.div>
          </motion.div>

          <div className="section-pad mx-auto mt-8 flex max-w-7xl items-center justify-between gap-6 md:mt-10">
            <p className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-muted uppercase">
              <span>Scroll to explore</span>
              <span aria-hidden className="inline-block animate-bounce">
                ↓
              </span>
            </p>

            {loops && (
              <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden items-center gap-1.5 sm:flex">
                  {images.map((image, i) => (
                    <button
                      key={image.id}
                      type="button"
                      aria-label={`Show image ${i + 1}`}
                      aria-current={i === active ? "true" : undefined}
                      onClick={() => nudge(i - active)}
                      className="group flex h-8 items-center"
                    >
                      <span
                        className={cn(
                          "block h-px transition-all duration-700",
                          i === active
                            ? "w-8 bg-ink"
                            : "w-4 bg-ink/20 group-hover:bg-ink/50"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p
                  aria-live="polite"
                  className="min-w-[3.5rem] text-[11px] tracking-[0.18em] text-muted tabular-nums"
                >
                  {String(active + 1).padStart(2, "0")} /{" "}
                  {String(count).padStart(2, "0")}
                </p>
                <div className="flex">
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => nudge(-1)}
                    className="flex h-11 w-11 items-center justify-center text-ink-soft transition-colors hover:text-ink"
                  >
                    <ArrowLeft size={18} strokeWidth={1.25} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => nudge(1)}
                    className="flex h-11 w-11 items-center justify-center text-ink-soft transition-colors hover:text-ink"
                  >
                    <ArrowRight size={18} strokeWidth={1.25} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

type SlideProps = {
  image: HeroGalleryImage;
  slot: number;
  number: number;
  total: number;
  x: MotionValue<number>;
  step: MotionValue<number>;
  eager: boolean;
  lead: boolean;
  hidden: boolean;
};

function Slide({
  image,
  slot,
  number,
  total,
  x,
  step,
  eager,
  lead,
  hidden,
}: SlideProps) {
  // Distance from the lead position in slides: 0 = lead, 1 = next, -1 = just passed.
  // Before measuring, the strip is untranslated, so slot 0 is in the lead position.
  const distance = useTransform([x, step], ([xv, size]: number[]) =>
    size ? (slot * size + xv) / size : slot
  );
  const scale = useTransform(
    distance,
    (d) => 1 - Math.min(Math.abs(d), 3) * 0.035
  );
  const opacity = useTransform(distance, (d) =>
    d < 0 ? Math.max(0.3, 1 + d * 0.7) : 1 - Math.min(d, 4) * 0.07
  );
  // The image layer is 24% wider than its frame, so ±9% of drift never shows an edge.
  const drift = useTransform(
    distance,
    (d) => `${Math.max(-1.5, Math.min(1.5, d)) * -6}%`
  );

  return (
    <motion.figure
      style={{ scale, opacity }}
      aria-hidden={hidden || undefined}
      className={cn(
        "group relative w-[74vw] max-w-[460px] shrink-0 sm:w-[46vw] md:w-[32vw] lg:w-[26vw]",
        OFFSETS[number % OFFSETS.length]
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-cream-deep",
          RATIOS[number % RATIOS.length]
        )}
      >
        <motion.div
          style={{ x: drift }}
          className="absolute inset-y-0 -left-[12%] -right-[12%]"
        >
          <Image
            src={image.imageUrl}
            alt={hidden ? "" : image.altText}
            fill
            loading={eager ? "eager" : "lazy"}
            fetchPriority={lead ? "high" : "auto"}
            sizes="(min-width: 1024px) 34vw, (min-width: 768px) 40vw, (min-width: 640px) 58vw, 92vw"
            draggable={false}
            className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/30 to-transparent" />
        <figcaption className="absolute right-4 bottom-4 text-[11px] tracking-[0.18em] text-cream/85 tabular-nums">
          {String(number + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </figcaption>
      </div>
    </motion.figure>
  );
}
