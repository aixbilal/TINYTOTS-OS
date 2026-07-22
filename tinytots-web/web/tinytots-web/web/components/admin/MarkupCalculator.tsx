"use client";

import { useEffect, useState } from "react";

type Props = {
  costPrice: string;
  shopBasePrice: string; shopDiscountPercent: string; shopFinalPrice: string;
  webBasePrice: string; webDiscountPercent: string; webFinalPrice: string;
  onCostChange: (v: string) => void;
  onShopBaseChange: (v: string) => void; onShopDiscountChange: (v: string) => void; onShopFinalChange: (v: string) => void;
  onWebBaseChange: (v: string) => void; onWebDiscountChange: (v: string) => void; onWebFinalChange: (v: string) => void;
};

export default function MarkupCalculator({
  costPrice,
  shopBasePrice, shopDiscountPercent, shopFinalPrice,
  webBasePrice, webDiscountPercent, webFinalPrice,
  onCostChange,
  onShopBaseChange, onShopDiscountChange, onShopFinalChange,
  onWebBaseChange, onWebDiscountChange, onWebFinalChange,
}: Props) {
  const [webMarkupPercent, setWebMarkupPercent] = useState("25");
  const [webBaseManual, setWebBaseManual] = useState(false);

  // Shop final = shop base minus shop discount
  useEffect(() => {
    const base = parseFloat(shopBasePrice);
    const disc = parseFloat(shopDiscountPercent || "0");
    if (isNaN(base)) return;
    onShopFinalChange(Math.round(base * (1 - disc / 100) * 100) / 100 + "");
  }, [shopBasePrice, shopDiscountPercent]);

  // Web base = shop base + web markup% (auto, unless manually overridden)
  useEffect(() => {
    if (webBaseManual) return;
    const base = parseFloat(shopBasePrice);
    if (isNaN(base)) return;
    const computed = base * (1 + parseFloat(webMarkupPercent || "0") / 100);
    onWebBaseChange(Math.round(computed * 100) / 100 + "");
  }, [shopBasePrice, webMarkupPercent, webBaseManual]);

  // Web final = web base minus web discount
  useEffect(() => {
    const base = parseFloat(webBasePrice);
    const disc = parseFloat(webDiscountPercent || "0");
    if (isNaN(base)) return;
    onWebFinalChange(Math.round(base * (1 - disc / 100) * 100) / 100 + "");
  }, [webBasePrice, webDiscountPercent]);

  const inputClass =
    "w-full border rounded-lg px-4 py-2 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none";

  const shopMargin = costPrice && shopFinalPrice ? Math.round((parseFloat(shopFinalPrice) - parseFloat(costPrice)) * 100) / 100 : null;
  const webMargin = costPrice && webFinalPrice ? Math.round((parseFloat(webFinalPrice) - parseFloat(costPrice)) * 100) / 100 : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Cost Price (Rs) — from supplier</label>
        <input type="number" value={costPrice} onChange={(e) => onCostChange(e.target.value)} className={inputClass} />
      </div>

      {/* SHOP PRICING */}
      <div className="border border-outline-variant/30 rounded-lg p-4 flex flex-col gap-3">
        <h3 className="font-headline-md text-headline-md text-on-surface">In-Store (Electron / receipt)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Shop Selling Price (Rs)</label>
            <input type="number" value={shopBasePrice} onChange={(e) => onShopBaseChange(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Shop Discount %</label>
            <input type="number" min="0" max="100" value={shopDiscountPercent} onChange={(e) => onShopDiscountChange(e.target.value)} className={inputClass} placeholder="0" />
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Bill price in-store: <strong className="text-on-surface">Rs. {shopFinalPrice || "—"}</strong>
          {shopMargin !== null && <> · Margin: <strong className={shopMargin >= 0 ? "text-primary" : "text-error"}>Rs. {shopMargin}</strong></>}
        </p>
      </div>

      {/* WEB PRICING */}
      <div className="border border-outline-variant/30 rounded-lg p-4 flex flex-col gap-3">
        <h3 className="font-headline-md text-headline-md text-on-surface">On the Website (funds free delivery + packaging)</h3>
        <div className="flex items-center gap-3">
          <label className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">Web Markup %</label>
          <input
            type="number"
            value={webMarkupPercent}
            onChange={(e) => { setWebBaseManual(false); setWebMarkupPercent(e.target.value); }}
            className={inputClass}
            placeholder="e.g. 25"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Web Base Price (Rs)</label>
            <input
              type="number"
              value={webBasePrice}
              onChange={(e) => { setWebBaseManual(true); onWebBaseChange(e.target.value); }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Web Discount %</label>
            <input type="number" min="0" max="100" value={webDiscountPercent} onChange={(e) => onWebDiscountChange(e.target.value)} className={inputClass} placeholder="0" />
          </div>
        </div>
        {webBaseManual && (
          <button type="button" onClick={() => setWebBaseManual(false)} className="self-start font-label-md text-label-md text-primary hover:underline">
            Reset web base to auto (shop price + markup)
          </button>
        )}
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Price shown on website: <strong className="text-on-surface">Rs. {webFinalPrice || "—"}</strong>
          {webMargin !== null && <> · Margin: <strong className={webMargin >= 0 ? "text-primary" : "text-error"}>Rs. {webMargin}</strong></>}
        </p>
      </div>
    </div>
  );
}