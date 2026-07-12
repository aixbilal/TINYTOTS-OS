import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Pencil, Plus, Search, ChevronDown, Bell } from "lucide-react";
import FloralFlourish from "../components/FloralFlourish";
import VariantsTable from "../components/inventory/VariantsTable";
import BarcodeQrPanel from "../components/inventory/BarcodeQrPanel";
import ProductFormModal from "../components/inventory/ProductFormModal";
import loginBg from "../assets/login-bg.png";

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [tab, setTab] = useState("variants");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | "edit"
  const [loading, setLoading] = useState(true);

  async function loadInventory() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/inventory");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        if (!selectedProductId && data.products.length) {
          setSelectedProductId(data.products[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [products, search]);

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAll(checked) {
    setSelectedIds(checked ? selectedProduct?.variants.map((v) => v.id) || [] : []);
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) return;
    if (!confirm(`Delete "${selectedProduct.name}" and all its variants? This can't be undone.`)) return;
    await fetch(`http://localhost:3000/api/products/${selectedProduct.id}`, { method: "DELETE" });
    setSelectedProductId(null);
    setSelectedIds([]);
    loadInventory();
  }

  return (
    <div
      className="min-h-screen px-10 py-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-ink-800 hover:text-maroon-700"
        >
          <ArrowLeft size={15} /> Dashboard
        </button>

        <div className="flex items-center gap-4">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/40 text-ink-800 hover:bg-white/20"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>
          <div className="w-10 h-10 rounded-full bg-maroon-700 text-cream-50 flex items-center justify-center font-semibold">
            M
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-8">
        <FloralFlourish className="absolute -top-4 right-0 w-80 h-40 pointer-events-none hidden md:block" />
        <div className="relative">
          <h1 className="font-display text-4xl text-maroon-800">
            Dynamic Inventory
          </h1>
          <p className="text-ink-800 mt-1">Add, manage and track all your products &amp; variants.</p>
        </div>

        <div className="flex gap-3 relative">
          <button className="px-4 py-2.5 rounded-lg border border-white/40 text-ink-900 text-sm font-medium hover:bg-white/20 backdrop-blur-sm">
            Import Products
          </button>
          <button
            onClick={() => setModal("create")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-maroon-700 text-cream-50 text-sm font-medium hover:bg-maroon-800"
          >
            <Plus size={16} /> Add New Product
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-ink-800 py-20">Loading inventory…</p>
      ) : !selectedProduct ? (
        <div className={`text-center py-24 ${glassCard}`} style={glassCardStyle}>
          <p className="text-ink-800 mb-4">No products yet.</p>
          <button
            onClick={() => setModal("create")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-maroon-700 text-cream-50 text-sm font-medium hover:bg-maroon-800"
          >
            <Plus size={16} /> Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Product picker */}
            <div className="relative">
              <button
                onClick={() => setPickerOpen((o) => !o)}
                className="inline-flex items-center gap-2 text-sm bg-white/25 backdrop-blur-sm border border-white/40 rounded-lg px-3 py-2 text-ink-900"
              >
                Viewing: <span className="font-semibold">{selectedProduct.name}</span>
                <ChevronDown size={14} />
              </button>
              {pickerOpen && (
                <div className="absolute z-10 mt-1 w-72 bg-white border border-cream-100 shadow-lg rounded-lg overflow-hidden">
                  <div className="p-2 border-b border-cream-100 flex items-center gap-2">
                    <Search size={14} className="text-ink-700/50" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search product or SKU…"
                      className="w-full text-sm outline-none"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setSelectedIds([]);
                          setPickerOpen(false);
                          setSearch("");
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-cream-50 flex justify-between ${
                          p.id === selectedProductId ? "bg-maroon-100 text-maroon-800" : ""
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="text-ink-700/50 text-xs">{p.total_variants} variants</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className={`p-6 hover:scale-[1.01] ${glassCard}`} style={glassCardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-maroon-800">Product Information</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal("edit")}
                    className="p-2 rounded-lg hover:bg-white/20 text-ink-800"
                    aria-label="Edit product"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    className="text-xs text-maroon-700 hover:underline px-2"
                  >
                    Delete product
                  </button>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-32 h-32 rounded-xl bg-white/20 border border-white/40 flex flex-col items-center justify-center flex-shrink-0 overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera size={22} className="text-ink-800/50 mb-1" />
                      <span className="text-[10px] text-ink-800/60">Change Image</span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-x-6 gap-y-3 flex-1 text-sm">
                  <Field label="Product Name" value={selectedProduct.name} />
                  <Field label="Category" value={selectedProduct.category || "—"} />
                  <Field label="Status" value={selectedProduct.status || "active"} pill />
                  <Field label="Brand" value={selectedProduct.brand || "—"} />
                  <Field label="SKU ID (Base)" value={selectedProduct.sku} mono />
                  <Field label="Total Variants" value={selectedProduct.total_variants} />
                  <Field label="HSN Code" value={selectedProduct.hsn_code || "—"} />
                  <Field label="Unit" value={selectedProduct.unit || "Pcs"} />
                  <Field label="Total Stock" value={selectedProduct.total_stock} />
                  <Field
                    label="Description"
                    value={selectedProduct.description || "—"}
                    className="col-span-2"
                  />
                  <Field
                    label="Created On"
                    value={
                      selectedProduct.created_at
                        ? new Date(selectedProduct.created_at).toLocaleDateString()
                        : "—"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className={`p-6 hover:scale-[1.01] ${glassCard}`} style={glassCardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-6 text-sm font-medium">
                  <button
                    onClick={() => setTab("variants")}
                    className={`pb-2 border-b-2 ${
                      tab === "variants" ? "border-maroon-700 text-maroon-700" : "border-transparent text-ink-800"
                    }`}
                  >
                    Variants ({selectedProduct.total_variants})
                  </button>
                  <button
                    onClick={() => setTab("stock")}
                    className={`pb-2 border-b-2 ${
                      tab === "stock" ? "border-maroon-700 text-maroon-700" : "border-transparent text-ink-800"
                    }`}
                  >
                    Stock Overview
                  </button>
                </div>
              </div>

              {tab === "variants" ? (
                <VariantsTable
                  variants={selectedProduct.variants}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onSelectAll={selectAll}
                  onChanged={loadInventory}
                />
              ) : (
                <StockOverview variants={selectedProduct.variants} />
              )}
            </div>
          </div>

          {/* Barcode / QR generation */}
          <div>
            <BarcodeQrPanel
              product={selectedProduct}
              allVariants={selectedProduct.variants}
              selectedIds={selectedIds}
            />
          </div>
        </div>
      )}

      {modal && (
        <ProductFormModal
          mode={modal}
          initialProduct={modal === "edit" ? selectedProduct : null}
          onClose={() => setModal(null)}
          onSaved={loadInventory}
        />
      )}
    </div>
  );
}

function Field({ label, value, mono, pill, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs text-ink-800/70">{label}</p>
      {pill ? (
        <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full bg-white/30 text-ink-900 capitalize">
          {value}
        </span>
      ) : (
        <p className={`text-ink-900 ${mono ? "font-mono text-sm" : "font-medium"}`}>{value}</p>
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

  return (
    <div className="space-y-3">
      {Object.entries(byColor).map(([color, stock]) => (
        <div key={color} className="flex items-center gap-3">
          <span className="w-20 text-sm text-ink-900 flex-shrink-0">{color}</span>
          <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-maroon-700 rounded-full"
              style={{ width: `${(stock / max) * 100}%` }}
            />
          </div>
          <span className="w-10 text-sm text-ink-800 text-right">{stock}</span>
        </div>
      ))}
      {variants.length === 0 && (
        <p className="text-center text-ink-800/60 py-8 text-sm">No stock data yet.</p>
      )}
    </div>
  );
}