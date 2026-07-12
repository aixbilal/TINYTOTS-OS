// Soft line-art flourish used in the top-right corner of module headers,
// matching the recurring decorative motif in the design reference.
// Kept as a single lightweight inline SVG (no image asset, no extra deps).
export default function FloralFlourish({ className = "" }) {
    return (
      <svg
        viewBox="0 0 420 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <g stroke="var(--color-gold-400)" strokeWidth="1.4" opacity="0.55">
          <path d="M10 150 C 90 140, 140 90, 130 40 C 122 4, 90 -6, 78 18 C 66 42, 92 58, 112 46" />
          <path d="M130 40 C 170 60, 230 55, 260 30 C 285 10, 320 8, 330 30" />
          <path d="M260 30 C 262 55, 285 70, 305 62" />
          <path d="M330 30 C 355 24, 380 34, 385 55" />
          <circle cx="386" cy="58" r="3.5" fill="var(--color-gold-400)" stroke="none" />
          <path d="M112 46 C 128 52, 138 68, 130 82" />
          <circle cx="129" cy="84" r="3" fill="var(--color-gold-400)" stroke="none" />
        </g>
      </svg>
    );
  }