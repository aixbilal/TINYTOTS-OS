import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../auth";
import rail from "../assets/lifestyle/rail-basket.webp";
import booties from "../assets/lifestyle/rail-booties.webp";
import girl from "../assets/lifestyle/girl-reading.webp";
import kids from "../assets/lifestyle/kids-reading.webp";
import peg from "../assets/lifestyle/peg-rail.webp";

/**
 * Startup splash — a short "image scatter" of warm TinyTots editorial tiles that
 * settle into a loose arrangement, then hand off to Sign-in with a soft morph
 * (adapted from the Vengeance UI Image Scatter grammar; owner §16–19).
 *
 * No video, no canvas, no render, no motion library — CSS keyframes + a couple
 * of timers. Rotation lives on the static slot so the resting composition is
 * correct even under `prefers-reduced-motion`. Total ≈ 1.9s.
 */
const TILES = [
  { src: rail, x: -150, rot: -9, z: 1, delay: 0 },
  { src: girl, x: -78, rot: -4, z: 2, delay: 90 },
  { src: kids, x: 0, rot: 0, z: 4, delay: 180, lift: true },
  { src: peg, x: 78, rot: 5, z: 3, delay: 270 },
  { src: booties, x: 150, rot: 10, z: 1, delay: 360 },
];

export default function Splash() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const toLeave = setTimeout(() => setLeaving(true), 1500);
    const toNext = setTimeout(
      () => navigate(isLoggedIn() ? "/dashboard" : "/login"),
      1920
    );
    return () => {
      clearTimeout(toLeave);
      clearTimeout(toNext);
    };
  }, [navigate]);

  return (
    <div
      className={`h-screen w-screen overflow-hidden bg-surface-app flex flex-col items-center justify-center ${
        leaving ? "tt-splash-leaving" : ""
      }`}
    >
      {/* Scatter stage */}
      <div className="relative w-[min(560px,90vw)] h-[280px]">
        {TILES.map((t, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-[128px] aspect-[3/4]"
            style={{
              transform: `translate(-50%, -50%) translateX(${t.x}px) rotate(${t.rot}deg) scale(${t.lift ? 1.12 : 1})`,
              zIndex: t.z,
            }}
          >
            <img
              src={t.src}
              alt=""
              className="tt-scatter-tile h-full w-full rounded-xl object-cover shadow-md ring-1 ring-black/[0.04]"
              style={{ "--sd": `${t.delay}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Wordmark + one-shot progress hint */}
      <div className="mt-9 flex flex-col items-center tt-anim-fade" style={{ animationDelay: "620ms" }}>
        <p className="font-display text-[26px] leading-none text-text-primary tracking-[-0.01em]">
          TinyTots<span className="text-brand"> OS</span>
        </p>
        <p className="type-tiny text-text-muted mt-2 tracking-[0.18em] uppercase">
          Manage · Sell · Grow
        </p>
        <div className="mt-4 h-px w-40 bg-border-default overflow-hidden">
          <div className="tt-splash-bar h-full w-full bg-brand" />
        </div>
      </div>

      <p className="absolute bottom-6 type-tiny text-text-muted">Powered by Vantixis</p>
    </div>
  );
}
