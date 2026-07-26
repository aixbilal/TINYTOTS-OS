"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Category = { id: number; name: string };

export default function CategorySelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        disabled={loading}
      >
        <option value="">{loading ? "Loading categories..." : "Select a category"}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
        {/* If the product already has a category that's since been removed
            from the categories table, keep showing it so nothing silently
            gets blanked out on save. */}
        {value && !categories.some((c) => c.name === value) && (
          <option value={value}>{value} (not in list)</option>
        )}
      </select>
      <Link
        href="/admin/categories"
        target="_blank"
        className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
      >
        Manage categories →
      </Link>
    </div>
  );
}
