import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';

export function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getSubtotal, getDeliveryCharge, getTotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Your Cart</h1>
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <ShoppingBag size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500 font-medium mt-3">Your cart is empty</p>
          <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 mt-4 bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-800 transition-colors"
          >
            Browse Products <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Your Cart ({items.length} items)</h1>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.product.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex gap-3">
            <Link to={`/product/${item.product.id}`} className="shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={item.product.image_url || ''}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.product.id}`}>
                <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{item.product.name}</h3>
              </Link>
              <p className="text-xs text-gray-400">{item.product.pack_size}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-bold text-green-700">{formatPrice(item.product.selling_price)}</span>
                {item.product.mrp > item.product.selling_price && (
                  <span className="text-xs text-gray-400 line-through">{formatPrice(item.product.mrp)}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-700 active:scale-95 transition-transform"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-700 active:scale-95 transition-transform"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-900">{formatPrice(item.product.selling_price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bill summary */}
      <div className="mt-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Bill Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Item subtotal</span>
            <span className="font-medium">{formatPrice(getSubtotal())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery charge</span>
            <span className="font-medium">
              {getDeliveryCharge() === 0 ? (
                <span className="text-green-600">FREE</span>
              ) : (
                formatPrice(getDeliveryCharge())
              )}
            </span>
          </div>
          {getDeliveryCharge() > 0 && (
            <p className="text-xs text-gray-400">
              Add {formatPrice(499 - getSubtotal())} more for free delivery
            </p>
          )}
          <div className="pt-2 border-t border-gray-100 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-green-700 text-lg">{formatPrice(getTotal())}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Cash on Delivery available
        </p>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="mt-4 w-full py-3.5 rounded-xl font-semibold text-sm bg-green-700 text-white hover:bg-green-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        Proceed to Checkout <ArrowRight size={18} />
      </button>
    </div>
  );
}
