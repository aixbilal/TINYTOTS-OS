import DOMPurify from "dompurify";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Pencil,
  Plus,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Package,
  Trash2,
  X,
} from "lucide-react";
import VariantsTable from "../components/Inventory/VariantsTable";
import BarcodeQrPanel from "../components/Inventory/BarcodeQrPanel";
import ProductFormModal from "../components/Inventory/ProductFormModal";
import ImageUploader from "../components/Inventory/ImageUploader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import SearchField from "../components/ui/SearchField";
import { PageHeader } from "../components/ui/Layout";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { LoadingState, EmptyState } from "../components/ui/States";
import { apiFetch } from "../services/api";

const LOW_STOCK_THRESHOLD = 5;

function priceLabel(variants = []) {
  const prices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
  if (!prices.length) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n) => `Rs. ${n.toLocaleString("en-PK")}`;
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

function stockStatus(totalStock) {
  if (totalStock <= 0) return { label: "Out of Stock", variant: "error" };
  if (totalStock <= LOW_STOCK_THRESHOLD) return { label: "Low Stock", variant: "warning" };
  return { label: "In Stock", variant: "success" };
}

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [view, setView] = useState("browse"); // "browse" | "detail"
  const [layout, setLayout] = useState("grid"); // "grid" | "list"
  const [selectedIds, setSelectedIds] = useState([]);
  const [tab, setTab] = useState("variants");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all | in | low | out
  const [sortBy, setSortBy] = useState("name"); // name | stock-asc | stock-desc | price
  const [modal, setModal] = useState(null); // null | "create" | "edit"
  const [photosOpen, setPhotosOpen] = useState(false);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  async function loadInventory() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("http://localhost:3000/api/inventory");
      const data = await res.json();
      if (data.success) setProducts(data.products);
      else setLoadError(true);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  useEffect(() => {
    if (!photosOpen || !selectedProduct) return;
    fetch(`http://localhost:3000/api/products/${selectedProduct.id}/images`)
      .then((r) => r.json())
      .then((json) => setProductImages(json.data || []))
      .catch(() => setProductImages([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photosOpen, selectedProductId]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return [...set].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q && !(p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))) {
        return false;
      }
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      const st = stockStatus(p.total_stock ?? 0).variant;
      if (statusFilter === "in" && st !== "success") return false;
      if (statusFilter === "low" && st !== "warning") return false;
      if (statusFilter === "out" && st !== "error") return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "stock-asc") return (a.total_stock ?? 0) - (b.total_stock ?? 0);
      if (sortBy === "stock-desc") return (b.total_stock ?? 0) - (a.total_stock ?? 0);
      if (sortBy === "price")
        return (a.variants?.[0]?.price ?? 0) - (b.variants?.[0]?.price ?? 0);
      return 0;
    });
    return list;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (sortBy !== "name" ? 1 : 0);

  function openDetail(id) {
    setSelectedProductId(id);
    setSelectedIds([]);
    setTab("variants");
    setView("detail");
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) return;
    if (!confirm(`Delete "${selectedProduct.name}" and all its variants? This can't be undone.`))
      return;
    await apiFetch(`/api/products/${selectedProduct.id}`, { method: "DELETE" });
    setSelectedProductId(null);
    setSelectedIds([]);
    setView("browse");
    loadInventory();
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function selectAll(checked) {
    setSelectedIds(checked ? selectedProduct?.variants.map((v) => v.id) || [] : []);
  }

  // ---------------------------------------------------------------- DETAIL VIEW
  if (view === "detail" && selectedProduct) {
    return (
      <div className="mx-auto max-w-[1600px] flex flex-col gap-5">
        <button
          onClick={() => setView("browse")}
          className="type-nav inline-flex items-center gap-2 text-text-secondary hover:text-text-primary w-fit"
        >
          <ArrowLeft size={15} /> Back to products
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="type-heading-lg text-text-primary">{selectedProduct.name}</h1>
            <p className="type-body-sm text-text-secondary mt-0.5">
              Edit product details, variants and label codes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setModal("edit")}>
              <Pencil size={14} /> Edit Product
            </Button>
            <Button variant="danger" onClick={handleDeleteProduct}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            {/* Product info */}
            <div className="rounded-lg border border-border-default bg-surface-panel p-5">
              <h2 className="type-section text-text-primary mb-4">Product Information</h2>
              <div className="flex gap-5">
                <button
                  type="button"
                  onClick={() => setPhotosOpen(true)}
                  className="w-28 h-28 rounded-lg bg-surface-elevated flex flex-col items-center justify-center flex-shrink-0 overflow-hidden hover:brightness-95 transition-[filter]"
                >
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera size={20} className="text-text-muted mb-1" />
                      <span className="type-label text-text-muted">Add image</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-3.5 flex-1">
                  <Field label="Category" value={selectedProduct.category || "—"} />
                  <Field label="Status" value={selectedProduct.status || "active"} pill />
                  <Field label="Brand" value={selectedProduct.brand || "—"} />
                  <Field label="Base SKU" value={selectedProduct.sku} mono />
                  <Field label="Total Variants" value={selectedProduct.total_variants} />
                  <Field label="Total Stock" value={selectedProduct.total_stock} />
                  <Field label="HSN Code" value={selectedProduct.hsn_code || "—"} mono />
                  <Field label="Unit" value={selectedProduct.unit || "Pcs"} />
                  <Field
                    label="Created On"
                    value={
                      selectedProduct.created_at
                        ? new Date(selectedProduct.created_at).toLocaleDateString()
                        : "—"
                    }
                  />
                  <Field
                    label="Description"
                    value={selectedProduct.description || "—"}
                    className="col-span-2 md:col-span-3"
                    html
                  />
                </div>
              </div>
            </div>

            {/* Variants / stock */}
            <div className="rounded-lg border border-border-default bg-surface-panel p-5">
              <div className="flex items-center gap-5 mb-4 type-nav border-b border-border-default">
                <button
                  onClick={() => setTab("variants")}
                  className={`pb-2 -mb-px border-b-2 ${
                    tab === "variants"
                      ? "border-brand text-text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Variants ({selectedProduct.total_variants})
                </button>
                <button
                  onClick={() => setTab("stock")}
                  className={`pb-2 -mb-px border-b-2 ${
                    tab === "stock"
                      ? "border-brand text-text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Stock Overview
                </button>
              </div>

              {tab === "variants" ? (
                <VariantsTable
                  variants={selectedProduct.variants}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onSelectAll={selectAll}
                  onChanged={loadInventory}
                  productId={selectedProduct.id}
                />
              ) : (
                <StockOverview variants={selectedProduct.variants} />
              )}
            </div>
          </div>

          <div>
            <BarcodeQrPanel
              product={selectedProduct}
              allVariants={selectedProduct.variants}
              selectedIds={selectedIds}
            />
          </div>
        </div>

        {modal && (
          <ProductFormModal
            mode={modal}
            initialProduct={modal === "edit" ? selectedProduct : null}
            onClose={() => setModal(null)}
            onSaved={loadInventory}
          />
        )}

        {photosOpen && (
          <div className="fixed inset-0 bg-surface-overlay tt-anim-fade flex items-center justify-center z-50 p-4">
            <div className="bg-surface-panel border border-border-strong rounded-xl shadow-lg w-full max-w-md p-6 tt-anim-dialog">
              <div className="flex items-center justify-between mb-4">
                <h2 className="type-section text-text-primary">
                  Photos — {selectedProduct.name}
                </h2>
                <button
                  onClick={() => {
                    setPhotosOpen(false);
                    loadInventory();
                  }}
                  className="type-btn text-text-secondary hover:text-text-primary"
                >
                  Done
                </button>
              </div>
              <ImageUploader
                productId={selectedProduct.id}
                images={productImages}
                onImagesChange={setProductImages}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- BROWSE VIEW
  return (
    <div className="mx-auto max-w-[1600px] flex flex-col gap-5">
      <PageHeader title="Inventory" description="Manage your products and stock.">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search products…"
          className="w-56"
        />
        <div className="relative">
          <Button variant="secondary" onClick={() => setFiltersOpen((o) => !o)}>
            <SlidersHorizontal size={14} /> Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 rounded-full bg-brand text-text-inverse type-tiny px-1.5 leading-4">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {filtersOpen && (
            <FiltersPanel
              categories={categories}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onClear={() => {
                setCategoryFilter("all");
                setStatusFilter("all");
                setSortBy("name");
              }}
              onClose={() => setFiltersOpen(false)}
            />
          )}
        </div>
        <Button onClick={() => setModal("create")}>
          <Plus size={15} /> Add Product
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="type-body-sm text-text-secondary">
          {loading ? "Loading…" : `${filteredProducts.length} of ${products.length} products`}
        </p>
        <div className="flex items-center rounded-md border border-border-default overflow-hidden">
          <button
            onClick={() => setLayout("grid")}
            className={`px-2.5 py-1.5 transition-colors ${
              layout === "grid"
                ? "bg-surface-elevated text-text-primary"
                : "text-text-muted hover:text-text-primary hover:bg-surface-sunken"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setLayout("list")}
            className={`px-2.5 py-1.5 border-l border-border-default transition-colors ${
              layout === "list"
                ? "bg-surface-elevated text-text-primary"
                : "text-text-muted hover:text-text-primary hover:bg-surface-sunken"
            }`}
            aria-label="List view"
          >
            <ListIcon size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading inventory…" />
      ) : loadError ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <EmptyState
            title="Couldn't load inventory"
            description="The local server didn't respond. Check the connection and try again."
            action={{ label: "Retry", onClick: loadInventory }}
          />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <EmptyState
            icon={Package}
            title={products.length === 0 ? "No products yet" : "No products match your filters"}
            description={
              products.length === 0
                ? "Add your first product to start managing inventory."
                : "Try clearing the search or filters."
            }
            action={
              products.length === 0
                ? { label: "Add your first product", onClick: () => setModal("create") }
                : undefined
            }
          />
        </div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filteredProducts.map((p) => (
            <ProductGridCard key={p.id} product={p} onOpen={() => openDetail(p.id)} />
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Product</TH>
              <TH>SKU</TH>
              <TH>Category</TH>
              <TH align="right">Stock</TH>
              <TH>Status</TH>
              <TH align="right">Price</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredProducts.map((p) => {
              const st = stockStatus(p.total_stock ?? 0);
              return (
                <TR key={p.id} onClick={() => openDetail(p.id)}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-md bg-surface-elevated overflow-hidden flex items-center justify-center text-text-muted shrink-0">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={14} />
                        )}
                      </span>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TD>
                  <TD className="type-mono text-text-secondary">{p.sku}</TD>
                  <TD className="text-text-secondary">{p.category || "—"}</TD>
                  <TD align="right" className="tabular-nums">{p.total_stock ?? 0}</TD>
                  <TD>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </TD>
                  <TD align="right" className="tabular-nums">{priceLabel(p.variants)}</TD>
                  <TD align="right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openDetail(p.id)}
                      className="text-text-muted hover:text-text-primary p-1"
                      aria-label="Edit product"
                    >
                      <Pencil size={15} />
                    </button>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      {modal && (
        <ProductFormModal
          mode={modal}
          initialProduct={null}
          onClose={() => setModal(null)}
          onSaved={loadInventory}
        />
      )}
    </div>
  );
}

function ProductGridCard({ product, onOpen }) {
  const st = stockStatus(product.total_stock ?? 0);
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col rounded-lg p-2.5 text-left transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <div className="aspect-square w-full rounded-md bg-surface-elevated overflow-hidden mb-2.5 flex items-center justify-center text-text-muted">
        {product.image_url ? (
          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Package size={22} />
        )}
      </div>
      <p className="type-body-sm font-medium text-text-primary line-clamp-1">{product.name}</p>
      <p className="type-caption text-text-muted mt-0.5 truncate">
        {product.sku} · {product.total_variants} variant{product.total_variants === 1 ? "" : "s"}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="type-body-sm font-semibold text-text-primary truncate">
          {priceLabel(product.variants)}
        </span>
        <Badge variant={st.variant}>{st.label}</Badge>
      </div>
      <p className="type-caption text-text-muted mt-1">Stock: {product.total_stock ?? 0}</p>
    </button>
  );
}

function FiltersPanel({
  categories,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  onClear,
  onClose,
}) {
  return (
    <div className="absolute right-0 top-11 z-30 w-64 rounded-lg border border-border-strong bg-surface-panel p-4 shadow-md tt-anim-pop">
      <div className="flex items-center justify-between mb-3">
        <p className="type-section text-text-primary">Filters</p>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary" aria-label="Close filters">
          <X size={15} />
        </button>
      </div>

      <label className="type-field-label text-text-secondary">Category</label>
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="type-input mt-1 mb-3 w-full rounded-md border border-border-default bg-surface-panel px-2.5 py-1.5 text-text-primary outline-none focus:border-brand"
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="type-field-label text-text-secondary">Stock status</label>
      <div className="mt-1 mb-3 grid grid-cols-2 gap-1.5">
        {[
          ["all", "All"],
          ["in", "In stock"],
          ["low", "Low"],
          ["out", "Out"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`type-caption rounded-md border px-2 py-1.5 transition-colors ${
              statusFilter === val
                ? "border-brand bg-brand-soft text-text-primary"
                : "border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-sunken"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="type-field-label text-text-secondary">Sort by</label>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="type-input mt-1 mb-3 w-full rounded-md border border-border-default bg-surface-panel px-2.5 py-1.5 text-text-primary outline-none focus:border-brand"
      >
        <option value="name">Name (A–Z)</option>
        <option value="stock-asc">Stock (low → high)</option>
        <option value="stock-desc">Stock (high → low)</option>
        <option value="price">Price (low → high)</option>
      </select>

      <button
        onClick={onClear}
        className="type-caption text-brand hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
}

function Field({ label, value, mono, pill, className = "", html = false }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="type-field-label text-text-muted">{label}</p>
      {pill ? (
        <span className="type-label inline-block mt-1 px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary capitalize">
          {value}
        </span>
      ) : html ? (
        <div
          className="rte-content type-body-sm text-text-primary mt-1 break-words [overflow-wrap:anywhere] max-w-[70ch]"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }}
        />
      ) : (
        <p
          className={`mt-1 text-text-primary ${
            mono ? "type-mono type-caption" : "type-body-sm"
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function StockOverview({ variants }) {
  const byColor = {};
  for (const v of variants) {
    byColor[v.color] = (byColor[v.color] || 0) + (v.stock || 0);
  }
  const max = Math.max(1, ...Object.values(byColor));

  if (variants.length === 0) {
    return (
      <p className="text-center text-text-muted py-8 type-body-sm">No stock data yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(byColor).map(([color, stock]) => (
        <div key={color} className="flex items-center gap-3">
          <span className="w-20 type-body-sm text-text-primary flex-shrink-0 capitalize">
            {color}
          </span>
          <div className="flex-1 h-2.5 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full"
              style={{ width: `${(stock / max) * 100}%` }}
            />
          </div>
          <span className="w-10 type-body-sm text-text-secondary text-right">{stock}</span>
        </div>
      ))}
    </div>
  );
}
