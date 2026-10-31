import { Link } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const discount = calculateDiscount(product.mrp, product.selling_price);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.image_url || 'https://images.pexels.com/photos/31280796/pexels-photo-31280796.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {discount}% OFF
          </span>
        )}
        {product.is_best_seller && (
          <span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Star size={10} fill="currentColor" /> Best
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.short_description}</p>
        <p className="text-xs text-gray-400 mt-1">{product.pack_size}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold text-green-700">{formatPrice(product.selling_price)}</span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          className={`mt-2.5 w-full py-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
            added
              ? 'bg-green-100 text-green-700'
              : 'bg-green-700 text-white hover:bg-green-800 active:scale-95'
          }`}
        >
          {added ? (
            'Added!'
          ) : (
            <>
              <Plus size={16} /> Add to Cart
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
