function ProductCard({ product, onAdd }) {
  return (
    <div
      onClick={() => onAdd(product)}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition"
    >
      <h2 className="text-lg font-bold">
        {product.name}
      </h2>

      <p className="text-gray-500 text-sm">
        SKU: {product.sku}
      </p>

      <p className="text-gray-500 text-sm">
        Color: {product.color}
      </p>

      <p className="text-gray-500 text-sm">
        Size: {product.size}
      </p>

      <p className="text-blue-600 font-semibold">
        ${product.price}
      </p>

      <p className="text-green-600 text-sm">
        Stock: {product.stock}
      </p>
    </div>
  );
}

export default ProductCard;