function ProductCard({ product, onAdd }) {
  return (
    <div
      onClick={() => onAdd(product)}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition"
    >
      <h2 className="type-card-title text-ink-900">{product.name}</h2>

      <p className="type-caption text-ink-700 mt-1 font-mono type-mono">SKU: {product.sku}</p>

      <p className="type-body-sm text-ink-700 mt-1">Color: {product.color}</p>

      <p className="type-body-sm text-ink-700">Size: {product.size}</p>

      <p className="type-body-lg text-maroon-700 mt-2">{product.price}</p>

      <p className="type-caption text-ink-700 mt-1">Stock: {product.stock}</p>
    </div>
  );
}

export default ProductCard;
