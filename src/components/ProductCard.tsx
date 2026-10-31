import { Link } from 'react-router-dom';
import { Plus, Star, Sparkles, Scale } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const discount = calculateDiscount(product.mrp, product.selling_price);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  // ওজনের মাপ বা প্যাক সাইজ প্রস্তুত করা
  const displayWeight = product.net_weight
    ? `${product.net_weight} ${product.weight_unit === 'kg' ? 'কেজি' : product.weight_unit === 'gm' ? 'গ্রাম' : product.weight_unit || ''}`
    : product.pack_size;

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.image_url || 'https://images.pexels.com/photos/31280796/pexels-photo-31280796.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
        />
        
        {/* ডিসকাউন্ট ও অফার ব্যাজ */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {discount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {discount}% ছাড়
            </span>
          )}
          {product.is_on_offer && (
            <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
              <Sparkles size={9} /> অফার
            </span>
          )}
        </div>

        {/* বেস্ট সেলার ও স্টক আউট ব্যাজ */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {product.is_best_seller && (
            <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
              <Star size={10} fill="currentColor" /> সেরা পছন্দ
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              স্টক শেষ
            </span>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
          {product.name}
        </h3>
        
        {product.short_description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.short_description}</p>
        )}

        {/* প্যাক সাইজ বা ওজনের ডিসপ্লে */}
        {displayWeight && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
            <Scale size={11} />
            <span>{displayWeight}</span>
          </div>
        )}

        {/* দাম ও MRP */}
        <div className="flex items-baseline gap-2 mt-2 pt-1">
          <span className="text-base md:text-lg font-extrabold text-emerald-800">
            {formatPrice(product.selling_price)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.mrp)}
            </span>
          )}
        </div>

        {/* বাটন */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`mt-2.5 w-full py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : added
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-95 shadow-xs'
          }`}
        >
          {isOutOfStock ? (
            'উপলব্ধ নেই'
          ) : added ? (
            'যোগ হয়েছে!'
          ) : (
            <>
              <Plus size={16} /> কার্টে যোগ করুন
            </>
          )}
        </button>
      </div>
    </Link>
  );
        }
        
