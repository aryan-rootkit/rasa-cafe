"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { heroSlides, siteInfo } from "@/data/site";
import { cn } from "@/lib/cn";

export default function HeroGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const onPointerDown = (e: ReactPointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
    };
    setDragging(true);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const el = trackRef.current;
    if (!el || !dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    el.scrollLeft = dragState.current.scrollLeft - dx;
  };

  const endDrag = (e: ReactPointerEvent) => {
    dragState.current.active = false;
    setDragging(false);
    try {
      trackRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onWheel = useCallback((e: ReactWheelEvent) => {
    const el = trackRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  }, []);

  return (
    <section id="home" className="relative overflow-hidden pt-28 md:pt-32">
      <div className="section-pad relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 max-w-xl md:mb-14"
        >
          <p className="font-serif text-5xl tracking-[0.18em] text-ink md:text-6xl">
            {siteInfo.name}
          </p>
          <p className="mt-3 text-sm tracking-[0.22em] text-muted uppercase md:text-[13px]">
            Food. Coffee. Moments.
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft md:text-base">
            Made for slow mornings, quick conversations and everything in
            between.
          </p>
        </motion.div>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          className={cn(
            "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(1.25rem,4vw,4.5rem)] pb-4 select-none md:gap-6",
            dragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {heroSlides.map((slide, index) => (
            <HeroSlideCard
              key={slide.id}
              slide={slide}
              index={index}
              total={heroSlides.length}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="section-pad mt-8 flex items-center gap-3 text-[11px] tracking-[0.2em] text-muted uppercase"
        >
          <span>Scroll to explore</span>
          <span className="inline-block animate-bounce">↓</span>
        </motion.p>
      </div>
    </section>
  );
}

function HeroSlideCard({
  slide,
  index,
  total,
}: {
  slide: (typeof heroSlides)[number];
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = window.innerWidth / 2;
      const cardCenter = rect.left + rect.width / 2;
      const dist = (cardCenter - center) / window.innerWidth;
      setOffset(dist * 18);
    };
    onScroll();
    parent.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      parent.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.12 + index * 0.06,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative aspect-[3/4] w-[72vw] max-w-[420px] shrink-0 snap-center overflow-hidden sm:w-[55vw] md:aspect-[4/5] md:w-[38vw] lg:max-w-[480px]"
    >
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
        style={{ transform: `scale(1.08) translateX(${offset}px)` }}
      >
        <Image
          src={slide.image}
          alt={slide.label}
          fill
          priority={index < 2}
          sizes="(max-width: 768px) 72vw, 38vw"
          className="object-cover"
          draggable={false}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
      <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between p-5 md:p-6">
        <p className="text-[11px] tracking-[0.22em] text-cream uppercase">
          {slide.label}
        </p>
        <p className="text-[11px] tracking-[0.18em] text-cream/80">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </div>
    </motion.article>
  );
}
