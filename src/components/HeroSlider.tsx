"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/types";
import { logClick } from "@/lib/analytics";

const AUTO_MS = 6000;
const SWIPE_PX = 48;

type Props = { slides: HeroSlide[] };

export function HeroSlider({ slides }: Props) {
  const activeSlides = slides.filter((s) => s.active && s.imageUrl.trim() && s.ctaUrl.trim());
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const n = activeSlides.length;
  const safeIndex = n ? ((index % n) + n) % n : 0;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!n) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n]
  );

  useEffect(() => {
    if (n <= 1) return;
    timerRef.current = setInterval(() => go(1), AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [n, go]);

  useEffect(() => {
    setIndex(0);
  }, [n]);

  if (n === 0) return null;

  const slide = activeSlides[safeIndex]!;

  async function handleCta() {
    await logClick(`hero_${slide.id}`, "/");
    window.open(slide.ctaUrl, "_blank", "noopener,noreferrer");
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const d = endX - touchStartX.current;
    touchStartX.current = null;
    if (d > SWIPE_PX) go(-1);
    else if (d < -SWIPE_PX) go(1);
  }

  return (
    <section
      id="hero"
      className="relative px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6"
      aria-roledescription="carousel"
      aria-label="Featured partners"
    >
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md dark:shadow-none">
        <div
          className="relative aspect-[4/5] w-full sm:aspect-[21/9] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            sizes="(max-width: 640px) 100vw, 1152px"
            loading={safeIndex === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/25 sm:to-transparent"
            aria-hidden
          />

          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-4 sm:inset-auto sm:right-4 sm:top-1/2 sm:w-[min(100%,420px)] sm:-translate-y-1/2 sm:p-0 md:right-8 lg:w-[min(100%,460px)]">
            <div className="rounded-2xl border border-white/15 bg-black/45 p-4 shadow-xl backdrop-blur-md sm:bg-black/55 sm:p-5">
              <h2 className="text-lg font-bold leading-tight text-white sm:text-xl md:text-2xl">
                {slide.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/90 sm:text-base">{slide.benefit}</p>
              <button
                type="button"
                onClick={() => void handleCta()}
                className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-[#1a1005] transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.99]"
              >
                {slide.ctaLabel}
              </button>
            </div>
          </div>

          {n > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:flex"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:flex"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}
        </div>

        {n > 1 ? (
          <div
            className="flex flex-wrap items-center justify-center gap-2 border-t border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 dark:bg-black/40"
            role="tablist"
            aria-label="Slide indicators"
          >
            {activeSlides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === safeIndex
                    ? "w-8 bg-amber-500"
                    : "w-2.5 bg-[var(--text-tertiary)]/40 hover:bg-[var(--text-tertiary)]/60"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
