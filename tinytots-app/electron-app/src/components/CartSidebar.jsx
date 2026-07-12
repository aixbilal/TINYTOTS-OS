function CartSidebar({ cart, onCheckout }) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    onCheckout(subtotal, tax, total);
  };

  return (
    <div className="bg-white shadow p-4 h-full rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        Active Cart
      </h2>

      {cart.length === 0 ? (
        <p className="text-gray-500">No products added.</p>
      ) : (
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.variant_id}
              className="border-b pb-2"
            >
              <h3 className="font-semibold">
                {item.name}
              </h3>

              <p className="text-sm">
                SKU: {item.sku}
              </p>

              <p className="text-sm">
                Color: {item.color}
              </p>

              <p className="text-sm">
                Size: {item.size}
              </p>

              <p>
                Qty: {item.qty}
              </p>

              <p>
                ${item.price} × {item.qty}
              </p>

              <p className="font-semibold">
                Line Total: ${(item.price * item.qty).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 border-t pt-4 space-y-2">
        <p>
          <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
        </p>

        <p>
          <strong>Tax (10%):</strong> ${tax.toFixed(2)}
        </p>

        <h3 className="text-lg font-bold">
          Total: ${total.toFixed(2)}
        </h3>

        <button
          onClick={handleCheckout}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}

export default CartSidebar;