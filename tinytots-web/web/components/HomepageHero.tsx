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
      // Single full-bleed photo, 16:9 on desktop, text overlaid directly on
      // top (not a separate text panel) - matches the approved reference:
      // one continuous image, text sits on its naturally-light left side.
      className="relative w-full aspect-[4/5] sm:aspect-[16/9] mb-stack-lg overflow-hidden bg-surface-canvas"
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
                priority={false}
                fetchPriority={isLcpSlide ? "high" : "auto"}
                loading={isLcpSlide ? "eager" : "lazy"}
                sizes="100vw"
                quality={75}
                className="object-cover sm:hidden"
              />
            ) : (
              <div className="absolute inset-0 sm:hidden bg-surface-secondary" />
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
                className="object-cover hidden sm:block"
              />
            ) : (
              <div className="absolute inset-0 hidden sm:block bg-surface-secondary" />
            )}
          </div>
        );
      })}

      {/* Soft light-to-transparent scrim on the left so overlaid text stays
          legible regardless of what an admin uploads later - the approved
          reference photo happens to have a naturally pale left side, but a
          future photo might not, so this is a safety net, not decoration. */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(250,247,242,0.92) 0%, rgba(250,247,242,0.55) 38%, rgba(250,247,242,0) 62%)",
        }}
      />

      <div className="absolute inset-0 z-[3] flex flex-col justify-center px-6 sm:px-10 md:px-16">
        <div className="max-w-md">
          {active.eyebrow && (
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-3 block">
              {active.eyebrow}
            </span>
          )}
          {active.headline && (
            <h1 className="font-display-md text-[30px] sm:text-[36px] md:text-[44px] text-text-primary leading-[1.15] tracking-tight mb-4">
              {active.headline}
            </h1>
          )}
          {active.subtitle && (
            <p className="font-body-md text-body-md text-text-secondary mb-6 leading-snug">
              {active.subtitle}
            </p>
          )}
          {(active.button_text && active.button_link) || (active.button_text_secondary && active.button_link_secondary) ? (
            <div className="flex items-center gap-3 flex-wrap">
              {active.button_text && active.button_link && (
                <Link
                  href={active.button_link}
                  className="inline-flex items-center justify-center bg-brand-primary text-white font-button text-button h-12 px-6 md:px-7 hover:opacity-90 transition-opacity duration-300"
                >
                  {active.button_text}
                </Link>
              )}
              {active.button_text_secondary && active.button_link_secondary && (
                <Link
                  href={active.button_link_secondary}
                  className="inline-flex items-center justify-center border border-border-default text-text-primary font-button text-button h-12 px-6 md:px-7 hover:bg-surface-elevated/60 transition-colors duration-300"
                >
                  {active.button_text_secondary}
                </Link>
              )}
            </div>
          ) : null}
        </div>

        {count > 1 && (
          <div className="flex items-center gap-2 mt-8">
            {valid.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? true : undefined}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-brand-primary" : "w-2 bg-border-default hover:bg-text-secondary"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
