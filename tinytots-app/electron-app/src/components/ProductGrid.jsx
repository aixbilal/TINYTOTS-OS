import ProductCard from "./ProductCard";

function ProductGrid({ products, onAdd }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.variant_id}
          product={product}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}

export default ProductGrid;