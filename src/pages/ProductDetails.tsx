import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, ShieldCheck, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';

export function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      try {
        const { data } = await supabase
          .from('products')
          .select('*, categories(*)')
          .eq('slug', slug)
          .maybeSingle();
        setProduct(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  const handleAdd = () => {
    if (!product) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-gray-800">পণ্যটি পাওয়া যায়নি</h2>
        <button onClick={() => navigate('/products')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
          সকল পণ্য দেখুন
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> ফিরে যান
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400">কোনো ছবি নেই</div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              {product.categories?.name || 'জেনারেল'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{product.name}</h1>
            <p className="text-xs text-gray-500 mt-1">{product.weight || 'স্ট্যান্ডার্ড প্যাক'}</p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-black text-emerald-800">{formatPrice(product.price)}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.original_price)}</span>
              )}
            </div>

            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
              <ShieldCheck className="w-4 h-4" /> ১০০% ফ্রেশ ও অথেনটিক
            </div>

            {product.description && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">বিবরণ</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t flex flex-col gap-3">
            <button
              onClick={handleAdd}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                added ? 'bg-emerald-800 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {added ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
              <span>{added ? 'ব্যাগে যুক্ত হয়েছে' : 'ব্যাগে যোগ করুন'}</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <Truck className="w-4 h-4 text-emerald-600" /> দ্রুততম ডেলিভারি সুবিধা
            </div>
          </div>
        </div>
      </div>
    </div>
  );
          }
              
