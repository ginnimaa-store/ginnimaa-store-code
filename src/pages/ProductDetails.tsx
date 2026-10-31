import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Shield, Truck, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/format';
import { useCart } from '@/context/CartContext';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (!id) return;
      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .maybeSingle();
      setProduct(prod);
      if (prod?.category_id) {
        const { data: cat } = await supabase
          .from('categories')
          .select('*')
          .eq('id', prod.category_id)
          .maybeSingle();
        setCategory(cat);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-medium">Product not found</p>
        <Link to="/products" className="text-green-700 font-semibold mt-2 inline-block">Browse all products</Link>
      </div>
    );
  }

  const discount = calculateDiscount(product.mrp, product.selling_price);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  return (
    <div className="max-w-4xl mx-auto pb-4">
      <div className="px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="relative aspect-square bg-gray-50">
            <img
              src={product.image_url || ''}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {discount}% OFF
              </span>
            )}
          </div>

          <div className="p-5">
            {category && (
              <Link
                to={`/products?category=${category.slug}`}
                className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full inline-block"
              >
                {category.name}
              </Link>
            )}
            <h1 className="text-xl font-bold text-gray-900 mt-2">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{product.short_description}</p>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-2xl font-bold text-green-700">{formatPrice(product.selling_price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-base text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                  <span className="text-sm font-semibold text-red-500">Save {formatPrice(product.mrp - product.selling_price)}</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Pack size: {product.pack_size}</p>

            {product.is_best_seller && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium">
                <Star size={14} fill="currentColor" /> Best Seller
              </div>
            )}

            {product.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Quantity selector */}
            <div className="mt-5 flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">Quantity</span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-700 active:scale-95 transition-transform"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-700 active:scale-95 transition-transform"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border-2 ${
                  added
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-green-700 text-green-700 hover:bg-green-50'
                }`}
              >
                {added ? (
                  <>
                    <Check size={18} /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-green-700 text-white hover:bg-green-800 active:scale-95 transition-all"
              >
                Buy Now
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center text-center gap-1">
                <Truck size={20} className="text-green-600" />
                <span className="text-[11px] text-gray-500 font-medium">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <Shield size={20} className="text-green-600" />
                <span className="text-[11px] text-gray-500 font-medium">Pure Quality</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <Check size={20} className="text-green-600" />
                <span className="text-[11px] text-gray-500 font-medium">Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
