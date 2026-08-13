"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HeroSlide } from "@/lib/hero-slides";

const ADVANCE_MS = 7_000;

export type { HeroSlide };

export default function HomepageHero({ slides }: { slides: HeroSlide[] }) {
  const valid = slides.filter((s) => s && (s.image_url || s.image_url_mobile || s.headline));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchPauseRef = useRef(false);

  const count = valid.length;
  const active = valid[Math.min(index, Math.max(count - 1, 0))] || valid[0];

  const goTo = useCallback(
    (i: number) => {
      if (count === 0) return;
      setIndex(((i % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [count, paused, index]);

  if (!active) return null;

  return (
    <section
      // Explicit aspect-ratio reserves LCP box before images decode (fixes CLS).
      // Matches prior 340px@~390w mobile and 700px@~1440w desktop proportions.
      className="relative w-screen max-w-[100vw] left-1/2 -translate-x-1/2 aspect-[39/34] md:aspect-[72/35] mb-stack-lg overflow-hidden"
      onTouchStart={() => {
        touchPauseRef.current = true;
        setPaused(true);
      }}
      onTouchEnd={() => {
        window.setTimeout(() => {
          touchPauseRef.current = false;
          setPaused(false);
        }, 400);
      }}
      onTouchCancel={() => {
        touchPauseRef.current = false;
        setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Homepage hero"
    >
      {valid.map((slide, i) => {
        const desktopUrl = slide.image_url || slide.image_url_mobile;
        const mobileUrl = slide.image_url_mobile || slide.image_url;
        const isActive = i === index;
        const isLcpSlide = i === 0;
        return (
          <div
            key={`${desktopUrl}-${mobileUrl}-${i}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-[1]" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={!isActive}
          >
            {mobileUrl ? (
              <Image
                src={mobileUrl}
                alt=""
                fill
                // LCP preload is media-scoped in HeroLcpPreload — avoid unconditional
                // priority here (it would force mobile bytes on desktop too).
                priority={false}
                fetchPriority={isLcpSlide ? "high" : "auto"}
                loading={isLcpSlide ? "eager" : "lazy"}
                sizes="100vw"
                quality={75}
                className="object-cover md:hidden"
              />
            ) : (
              <div className="absolute inset-0 md:hidden bg-surface-container" />
            )}
            {desktopUrl ? (
              <Image
                src={desktopUrl}
                alt=""
                fill
                priority={false}
                fetchPriority={isLcpSlide ? "high" : "auto"}
                loading={isLcpSlide ? "eager" : "lazy"}
                sizes="100vw"
                quality={75}
                className="object-cover hidden md:block"
              />
            ) : (
              <div className="absolute inset-0 hidden md:block bg-surface-container" />
            )}
          </div>
        );
      })}

      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(to top right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 42%, rgba(0,0,0,0) 70%)",
        }}
      />

      <div className="absolute inset-0 z-[3] flex items-end justify-start p-6 md:p-10 lg:p-14 pb-14 md:pb-16">
        <div className="max-w-xl md:max-w-2xl text-left">
          {active.headline && (
            <h1 className="font-display-md text-[28px] md:text-[48px] lg:text-[56px] max-w-[18ch] md:max-w-xl text-white leading-[1.15] tracking-tight mb-3 md:mb-4">
              {active.headline}
            </h1>
          )}
          {active.subtitle && (
            <p className="font-body-lg text-body-md md:text-body-lg text-white/90 mb-5 md:mb-7 max-w-lg leading-snug">
              {active.subtitle}
            </p>
          )}
          {active.button_text && active.button_link && (
            <Link
              href={active.button_link}
              className="inline-flex items-center bg-brand-primary text-white font-button text-button h-12 md:h-[56px] px-6 md:px-8 rounded-lg hover:opacity-90 transition-opacity duration-300"
            >
              {active.button_text}
            </Link>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[4] flex items-center gap-2">
          {valid.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? true : undefined}
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index ? "w-7 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
