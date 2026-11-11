import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Scale, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';

export function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getSubtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">আপনার শপিং কার্ট</h1>
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-700">
            <ShoppingBag size={32} />
          </div>
          <p className="text-gray-800 font-bold text-base mt-4">আপনার কার্ট খালি আছে</p>
          <p className="text-xs text-gray-400 mt-1">তাজা মাছ, মুরগি বা খাসির মাংস কার্টে যোগ করুন</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 mt-5 bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-xs md:text-sm hover:bg-emerald-800 transition-colors shadow-xs"
          >
            পণ্য দেখুন <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const totalSavings = items.reduce((sum, item) => {
    if (item.product.mrp > item.product.selling_price) {
      return sum + (item.product.mrp - item.product.selling_price) * item.quantity;
    }
    return sum;
  }, 0);

  // নিয়ম: ২০০ টাকা বা তার বেশি হলে ডেলিভারি ফ্রি (০ টাকা), ২০০ টাকার নিচে হলে ৩৫ টাকা
  const subtotal = Number(getSubtotal()) || 0;
  const deliveryCharge = subtotal >= 200 ? 0 : 35;
  const grandTotal = subtotal + deliveryCharge;

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">আপনার কার্ট</h1>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
          {items.length}টি আইটেম
        </span>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const displayWeight = item.product.net_weight
            ? `${item.product.net_weight} ${item.product.weight_unit === 'kg' ? 'কেজি' : item.product.weight_unit === 'gm' ? 'গ্রাম' : item.product.weight_unit || ''}`
            : item.product.pack_size;

          return (
            <div key={item.product.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex gap-3 hover:border-emerald-100 transition-all">
              <Link to={`/product/${item.product.id}`} className="shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img
                    src={item.product.image_url || 'https://images.pexels.com/photos/31280796/pexels-photo-31280796.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product.id}`}>
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 hover:text-emerald-700">
                    {item.product.name}
                  </h3>
                </Link>

                {displayWeight && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded mt-0.5">
                    <Scale size={10} />
                    <span>{displayWeight}</span>
                  </div>
                )}

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-bold text-emerald-800 text-sm">{formatPrice(item.product.selling_price)}</span>
                  {item.product.mrp > item.product.selling_price && (
                    <span className="text-xs text-gray-400 line-through">{formatPrice(item.product.mrp)}</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-xs text-gray-700 active:scale-95 transition-transform hover:bg-gray-50"
                      title="কমান"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-xs text-gray-700 active:scale-95 transition-transform hover:bg-gray-50"
                      title="বাড়ান"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                    title="সরিয়ে ফেলুন"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-extrabold text-gray-900">
                  {formatPrice(item.product.selling_price * item.quantity)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bill summary */}
      <div className="mt-5 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <h3 className="font-bold text-gray-900 text-sm mb-3">বিল ও পেমেন্টের বিবরণ</h3>
        <div className="space-y-2 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">পণ্যের মোট মূল্য</span>
            <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">ডেলিভারি চার্জ</span>
            <span className="font-semibold">
              {deliveryCharge === 0 ? (
                <span className="text-emerald-700 font-bold">ফ্রি (FREE)</span>
              ) : (
                formatPrice(deliveryCharge)
              )}
            </span>
          </div>

          {totalSavings > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium bg-emerald-50/60 p-2 rounded-xl">
              <span>আপনার মোট সাশ্রয়</span>
              <span>{formatPrice(totalSavings)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
            <span className="font-bold text-gray-900 text-sm">সর্বমোট প্রদেয়</span>
            <span className="font-extrabold text-emerald-800 text-lg">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1 text-emerald-800 font-medium">
            <ShieldCheck size={14} /> ক্যাশ অন ডেলিভারি ও UPI উপলব্ধ
          </span>
          <span className="text-gray-400">সকালের তাজা স্টক</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/checkout')}
        className="mt-4 w-full py-3.5 rounded-xl font-bold text-xs md:text-sm bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs"
      >
        চেকআউট ও ডেলিভারি ঠিকানায় যান <ArrowRight size={17} />
      </button>
    </div>
  );
                    }
        
