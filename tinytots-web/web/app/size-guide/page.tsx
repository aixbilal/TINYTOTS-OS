"use client";

import { useState } from "react";
import Link from "next/link";

const AGE_SIZES = [
    { age: "0–3 Months", height: "50–61 cm", weight: "3–6 kg", label: "NB / 0-3M" },
    { age: "3–6 Months", height: "61–67 cm", weight: "6–8 kg", label: "3-6M" },
    { age: "6–9 Months", height: "67–72 cm", weight: "8–9 kg", label: "6-9M" },
    { age: "9–12 Months", height: "72–76 cm", weight: "9–10.5 kg", label: "9-12M" },
    { age: "1–2 Years", height: "76–86 cm", weight: "10.5–13 kg", label: "1-2Y" },
    { age: "2–3 Years", height: "86–98 cm", weight: "13–15 kg", label: "2-3Y" },
    { age: "3–4 Years", height: "98–104 cm", weight: "15–17 kg", label: "3-4Y" },
  ];
  
  const SHOE_SIZES = [
    { age: "6–12 Months", eu: "18–19", foot: "10.5–11.5 cm" },
    { age: "1–2 Years", eu: "20–22", foot: "12–13.5 cm" },
    { age: "2–3 Years", eu: "23–25", foot: "14–15.5 cm" },
    { age: "3–4 Years", eu: "26–27", foot: "16–16.5 cm" },
  ];

// Parses a range string like "50–61 cm" or "10.5–13 kg" into [min, max].
function parseRange(str: string): [number, number] {
  const nums = str.match(/[\d.]+/g)?.map(Number) || [];
  if (nums.length === 1) return [nums[0], nums[0]];
  return [nums[0], nums[1] ?? nums[0]];
}

function SizeFinder() {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [result, setResult] = useState<{ clothing: typeof AGE_SIZES[number]; shoe: typeof SHOE_SIZES[number] | null } | null>(null);
  const [touched, setTouched] = useState(false);

  function findSize() {
    setTouched(true);
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h && !w) {
      setResult(null);
      return;
    }

    // Score each clothing bracket by how well height/weight fits its range,
    // and take the closest match rather than requiring an exact hit —
    // real measurements rarely land perfectly inside one bracket.
    let best = AGE_SIZES[0];
    let bestScore = Infinity;
    for (const row of AGE_SIZES) {
      const [hMin, hMax] = parseRange(row.height);
      const [wMin, wMax] = parseRange(row.weight);
      let score = 0;
      if (h) score += h < hMin ? hMin - h : h > hMax ? h - hMax : 0;
      if (w) score += (w < wMin ? wMin - w : w > wMax ? w - wMax : 0) * 3; // weight is a weaker signal, still counts
      if (score < bestScore) {
        bestScore = score;
        best = row;
      }
    }

    let bestShoe: (typeof SHOE_SIZES)[number] | null = null;
    if (h) {
      let shoeScore = Infinity;
      for (const row of SHOE_SIZES) {
        const [fMin, fMax] = parseRange(row.foot);
        // Rough proxy: shoe brackets track the same age ranges as clothing,
        // so estimate foot fit indirectly via the clothing height match.
        const [hMin, hMax] = parseRange(
          row.age === "6–12 Months" ? "67–76 cm" : row.age === "1–2 Years" ? "76–86 cm" : row.age === "2–3 Years" ? "86–98 cm" : "98–104 cm"
        );
        const score = h < hMin ? hMin - h : h > hMax ? h - hMax : 0;
        if (score < shoeScore) {
          shoeScore = score;
          bestShoe = row;
        }
      }
    }

    setResult({ clothing: best, shoe: bestShoe });
  }

  return (
    <section className="mb-stack-lg bg-primary-container/10 border border-primary-container/30 rounded-2xl p-6 max-w-2xl">
      <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Find Your Child's Size</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
        Enter your child's height and/or weight for a size recommendation.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Height (cm)</label>
          <input
            type="number"
            min={0}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="e.g. 80"
            className="w-full border border-outline-variant/40 rounded-lg px-3 py-2 font-body-md text-body-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex-1">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Weight (kg) — optional</label>
          <input
            type="number"
            min={0}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 11"
            className="w-full border border-outline-variant/40 rounded-lg px-3 py-2 font-body-md text-body-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={findSize}
          className="self-end font-button text-button px-6 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors"
        >
          Find Size
        </button>
      </div>

      {touched && !result && (
        <p className="font-body-sm text-body-sm text-error">Enter at least a height or weight to get a recommendation.</p>
      )}

      {result && (
        <div className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Recommended Clothing Size</p>
            <p className="font-headline-md text-headline-md text-primary">{result.clothing.label}</p>
            {result.shoe && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Shoe size: EU {result.shoe.eu} ({result.shoe.foot})
              </p>
            )}
          </div>
          <Link
            href="/products"
            className="sm:ml-auto font-button text-button px-5 py-2 rounded-lg border border-primary-container text-primary hover:bg-primary-container/20 transition-colors text-center"
          >
            Shop Products
          </Link>
        </div>
      )}
    </section>
  );
}

  export default function SizeGuidePage() {
    return (
      <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
        <h1 className="font-display-md text-display-md text-on-surface mb-2">Size Guide</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg max-w-2xl">
          A general guide for clothing and footwear. Babies grow at different rates, so use height and
          weight as your primary reference — if your little one is between sizes, we recommend sizing up.
        </p>

        <SizeFinder />
  
        <section className="mb-stack-lg">
          <h2 className="font-headline-lg text-on-surface mb-stack-sm">Clothing</h2>
          <div className="overflow-x-auto border border-outline-variant/20 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-4 py-3">
                    Size Label
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-4 py-3">
                    Age
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-4 py-3">
                    Height
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-4 py-3">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {AGE_SIZES.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}>
                    <td className="font-body-md text-body-md text-on-surface font-medium px-4 py-3">{row.label}</td>
                    <td className="font-body-sm text-body-sm text-on-surface-variant px-4 py-3">{row.age}</td>
                    <td className="font-body-sm text-body-sm text-on-surface-variant px-4 py-3">{row.height}</td>
                    <td className="font-body-sm text-body-sm text-on-surface-variant px-4 py-3">{row.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
  
        <section className="mb-stack-lg">
          <h2 className="font-headline-lg text-on-surface mb-stack-sm">Footwear</h2>
          <div className="overflow-x-auto border border-outline-variant/20 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-4 py-3">
                    Age
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-4 py-3">
                    EU Size
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-4 py-3">
                    Foot Length
                  </th>
                </tr>
              </thead>
              <tbody>
                {SHOE_SIZES.map((row, i) => (
                  <tr key={row.age} className={i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface"}>
                    <td className="font-body-md text-body-md text-on-surface font-medium px-4 py-3">{row.age}</td>
                    <td className="font-body-sm text-body-sm text-on-surface-variant px-4 py-3">{row.eu}</td>
                    <td className="font-body-sm text-body-sm text-on-surface-variant px-4 py-3">{row.foot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
  
        <section className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 max-w-2xl">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">How to measure</h2>
          <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant list-disc pl-5">
            <li>
              <span className="text-on-surface font-medium">Height:</span> Lay your child flat and measure
              from the top of the head to the heel.
            </li>
            <li>
              <span className="text-on-surface font-medium">Foot length:</span> Trace their foot on paper
              while standing, then measure the longest point, heel to toe.
            </li>
            <li>
              Between sizes? Choose the larger size, especially for growing newborns and toddlers.
            </li>
          </ul>
        </section>
      </main>
    );
  }