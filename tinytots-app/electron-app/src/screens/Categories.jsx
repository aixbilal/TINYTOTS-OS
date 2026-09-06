import { useCallback, useEffect, useMemo, useState } from "react";
import { Tags } from "lucide-react";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import SearchField from "../components/ui/SearchField";
import { PageHeader } from "../components/ui/Layout";

/**
 * Read-only operational view of the product categories that actually exist
 * in inventory. There is no dedicated /api/categories contract, so this
 * screen derives everything from the same real dataset the Inventory screen
 * uses (GET /api/inventory) — unique non-empty product.category values plus
 * safe aggregates from the returned products/variants.
 *
 * Deliberately read-only: no create / rename / delete / ordering, because no
 * category contract exists to back those actions.
 */
export default function Categories() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");

  const loadInventory = useCallback(() => {
    fetch("http://localhost:3000/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  function retry() {
    setLoading(true);
    setLoadError(false);
    loadInventory();
  }

  const categories = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const name = (p.category || "").trim();
      if (!name) continue;
      const entry = map.get(name) || { name, products: 0, variants: 0, stock: 0 };
      entry.products += 1;
      entry.variants += p.total_variants ?? p.variants?.length ?? 0;
      entry.stock +=
        p.total_stock ??
        (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
      map.set(name, entry);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const uncategorised = products.filter((p) => !(p.category || "").trim()).length;

  return (
    <div className="mx-auto max-w-[1100px] flex flex-col gap-5">
      <PageHeader
        title="Categories"
        description="Product categories in use across your inventory. Read-only overview."
      >
        {categories.length > 0 && (
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search categories…"
            className="w-56"
          />
        )}
      </PageHeader>

      {loading ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <LoadingState label="Loading categories…" />
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <ErrorState
            title="Couldn't load categories"
            description="The local server didn't respond. Check the connection and try again."
            onRetry={retry}
          />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <EmptyState
            icon={Tags}
            title="No categories yet"
            description="Categories appear here once products are given a category in Inventory."
          />
        </div>
      ) : (
        <>
          <p className="type-body-sm text-text-secondary">
            {filtered.length} of {categories.length} categor
            {categories.length === 1 ? "y" : "ies"}
            {uncategorised > 0 && (
              <span className="text-text-muted">
                {" "}
                · {uncategorised} product{uncategorised === 1 ? "" : "s"} without a
                category
              </span>
            )}
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-border-default bg-surface-panel">
              <EmptyState
                icon={Tags}
                title="No categories match your search"
                description="Try a different term."
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Category</TH>
                  <TH align="right">Products</TH>
                  <TH align="right">Variants</TH>
                  <TH align="right">Stock</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((c) => (
                  <TR key={c.name}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD align="right">{c.products}</TD>
                    <TD align="right" className="text-text-secondary">
                      {c.variants}
                    </TD>
                    <TD align="right" className="text-text-secondary">
                      {c.stock.toLocaleString("en-PK")}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
