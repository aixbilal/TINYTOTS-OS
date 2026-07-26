"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";

export default function WishlistButton({
  productId,
  className = "",
}: {
  productId: number;
  className?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const active = isWishlisted(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    toggle(productId);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex items-center justify-center rounded-full transition-colors ${className}`}
    >
      <span
        className={`material-symbols-outlined text-[20px] ${
          active ? "text-error" : "text-on-surface-variant"
        }`}
        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        favorite
      </span>
    </button>
  );
}