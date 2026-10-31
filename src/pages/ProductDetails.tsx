import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Shield, Truck, Check, Scale, Sparkles } from 'lucide-react';
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
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-medium">পণ্যটি পাওয়া যায়নি</p>
        <Link to="/products" className="text-emerald-700 font-semibold mt-2 inline-block">
          সব পণ্য দেখুন
        </Link>
      </div>
    );
  }

  const discount = calculateDiscount(product.mrp, product.selling_price);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const displayWeight = product.net_weight
    ? `${product.net_weight} ${product.weight_unit === 'kg' ? 'কেজি' : product.weight_unit === 'gm' ? 'গ্রাম' : product.weight_unit || ''}`
    : product.pack_size;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    navigate('/cart');
  };

  return (
    <div className="max-w-4xl mx-auto pb-6">
      <div className="px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 text-xs md:text-sm font-semibold hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} /> পেছনে যান
        </button>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs">
          <div className="relative aspect-square md:aspect-video max-h-96 bg-gray-50 flex items-center justify-center">
            <img
              src={product.image_url || 'https://images.pexels.com/photos/31280796/pexels-photo-31280796.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
              alt={product.name}
              className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {discount}% ছাড়
              </span>
            )}
            {isOutOfStock && (
              <span className="absolute top-4 right-4 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                স্টক শেষ
              </span>
            )}
          </div>

          <div className="p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Link
                  to={`/products?category=${category.slug}`}
                  className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full inline-block hover:bg-emerald-100 transition-colors"
                >
                  {category.name}
                </Link>
              )}
              {product.is_best_seller && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  <Star size={12} fill="currentColor" /> সেরা পছন্দ
                </span>
              )}
              {product.is_on_offer && (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  <Sparkles size={12} /> বিশেষ অফার
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-black text-gray-900 mt-2.5">{product.name}</h1>
            {product.short_description && (
              <p className="text-xs md:text-sm text-gray-500 mt-1">{product.short_description}</p>
            )}

            {/* ওজন ব্যাজ */}
            {displayWeight && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/
          
