import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Scale, Sparkles, Check, ShieldCheck, Truck } from 'lucide-react';
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
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [selectedCut, setSelectedCut] = useState<string>('');

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
        <p className="text-lg font-medium">পণ্যটি পাওয়া যায়নি</p>
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

  const unitOptions: string[] = product.unit_options
    ? (typeof product.unit_options === 'string' ? JSON.parse(product.unit_options as string) : product.unit_options as string[])
    : [];

  const cutOptions: string[] = product.cut_options
    ? (typeof product.cut_options === 'string' ? JSON.parse(product.cut_options as string) : product.cut_options as string[])
    : [];

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const productWithOptions = {
      ...product,
      pack_size: selectedWeight || product.pack_size,
    };
    addToCart(productWithOptions as any, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product as any, quantity);
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
                {discount}% ছাড়
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

            {displayWeight && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg">
                <Scale size={13} /> {displayWeight}
              </div>
            )}

            {product.description && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{product.description}</p>
            )}

            {/* Weight options selection */}
            {unitOptions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-2">ওজন নির্বাচন করুন</h4>
                <div className="flex flex-wrap gap-2">
                  {unitOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedWeight(opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedWeight === opt
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cut preference selection */}
            {cutOptions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-2">কাটের ধরন নির্বাচন করুন</h4>
                <div className="flex flex-wrap gap-2">
                  {cutOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedCut(opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedCut === opt
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl md:text-3xl font-black text-emerald-800">
                {formatPrice(product.selling_price)}
              </span>
              {discount > 0 && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.mrp)}
                </span>
              )}
            </div>

            {!isOutOfStock && product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-1.5">শুধু {product.stock}টি বাকি! দ্রুত অর্ডার করুন</p>
            )}

            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
              <ShieldCheck size={14} /> ১০০% ফ্রেশ ও অথেনটিক
            </div>

            {/* Quantity selector */}
            {!isOutOfStock && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-2">পরিমাণ</h4>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-xs text-gray-700 active:scale-95 transition-transform hover:bg-gray-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 flex items-center justify-center bg-white rounded-lg shadow-xs text-gray-700 active:scale-95 transition-transform hover:bg-gray-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.98] shadow-xs'
                  }`}
                >
                  {isOutOfStock ? (
                    'উপলব্ধ নেই'
                  ) : added ? (
                    <>
                      <Check size={18} /> কার্টে যুক্ত হয়েছে
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} /> কার্টে যোগ করুন
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  এখনই কিনুন
                </button>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <Truck size={14} className="text-emerald-600" /> দ্রুততম ডেলিভারি সুবিধা
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
