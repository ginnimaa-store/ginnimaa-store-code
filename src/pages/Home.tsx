import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, TrendingUp, Sparkles, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, featRes, bestRes, offerRes] = await Promise.all([
          supabase.from('categories').select('*').order('display_order'),
          supabase.from('products').select('*').eq('is_featured', true).eq('active', true).limit(8),
          supabase.from('products').select('*').eq('is_best_seller', true).eq('active', true).limit(10),
          supabase.from('products').select('*').eq('is_on_offer', true).eq('active', true).limit(10),
        ]);
        setCategories(catRes.data || []);
        setFeatured(featRes.data || []);
        setBestSellers(bestRes.data || []);
        setOffers(offerRes.data || []);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-green-800 to-teal-900 m-4 rounded-3xl p-6 md:p-10 text-white shadow-lg">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 mb-3">
            <MapPin size={13} /> তাজা মাছ ও মাংস ডেলিভারি
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">
            তাজা মাছ ও খাঁটি মাংস,<br />সরাসরি আপনার দরজায়
          </h1>
          <p className="mt-2 text-emerald-100 text-sm md:text-base">
            সকালে কাটা ফ্রেশ মাছ, দেশি মুরগি ও টাটকা খাসির মাংস — দ্রুত হোম ডেলিভারি
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-emerald-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm"
            >
              এখনই অর্ডার করুন <ArrowRight size={16} />
            </Link>
            <Link
              to="/products?category=fish"
              className="inline-flex items-center gap-1.5 bg-emerald-700/60 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm border border-emerald-500/40 transition-colors"
            >
              🐟 তাজা মাছ
            </Link>
            <Link
              to="/products?category=meat"
              className="inline-flex items-center gap-1.5 bg-emerald-700/60 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm border border-emerald-500/40 transition-colors"
            >
              🍗 মাংস
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 w-48 h-48 md:w-80 md:h-80 rounded-full bg-white/10 -mr-16 -mb-16 pointer-events-none" />
        <div className="absolute right-12 top-4 w-28 h-28 rounded-full bg-emerald-500/10 pointer-events-none" />
      </div>

      {/* Fresh Fish & Meat Quick Category Banners */}
      <section className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Link
          to="/products?category=fish"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-900 to-blue-800 p-4 text-white shadow hover:shadow-md transition-all group"
        >
          <div className="relative z-10">
            <span className="text-2xl">🐟</span>
            <h3 className="font-bold text-base md:text-lg mt-1">তাজা মাছ</h3>
            <p className="text-[11px] md:text-xs text-cyan-200 mt-0.5">রুই, কাতলা, ইলিশ, চিংড়ি ও জ্যান্ত মাছ</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 mt-2 group-hover:translate-x-1 transition-transform">
              সব মাছ দেখুন <ArrowRight size={12} />
            </span>
          </div>
        </Link>

        <Link
          to="/products?category=meat"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 to-rose-900 p-4 text-white shadow hover:shadow-md transition-all group"
        >
          <div className="relative z-10">
            <span className="text-2xl">🍗</span>
            <h3 className="font-bold text-base md:text-lg mt-1">ফ্রেশ মাংস</h3>
            <p className="text-[11px] md:text-xs text-rose-200 mt-0.5">ফার্ম ও দেশি চিকেন, কচি খাসির মাংস</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 mt-2 group-hover:translate-x-1 transition-transform">
              মাংসের তালিকা <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      </section>

      {/* Categories */}
      <section className="px-4 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">ক্যাটাগরি সমূহ</h2>
          <Link to="/categories" className="text-sm text-emerald-700 font-semibold flex items-center gap-1 hover:underline">
            সব দেখুন <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group-hover:border-emerald-400 group-hover:shadow transition-all">
                <img
                  src={cat.image_url || ''}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight group-hover:text-emerald-700 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Special Offers */}
      {offers.length > 0 && (
        <section className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag size={20} className="text-red-500" />
              <h2 className="text-lg font-bold text-gray-900">সেরা অফার ও ছাড়</h2>
            </div>
            <Link to="/products" className="text-xs text-gray-500 font-medium hover:text-emerald-700">আরও দেখুন</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {offers.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">জনপ্রিয় পছন্দসমূহ</h2>
            </div>
            <Link to="/products" className="text-xs text-gray-500 font-medium hover:text-emerald-700">আরও দেখুন</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {featured.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="px-4 mt-8 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">সবচেয়ে বেশি বিক্রিত</h2>
            </div>
            <Link to="/products" className="text-xs text-gray-500 font-medium hover:text-emerald-700">আরও দেখুন</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {bestSellers.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <section className="px-4 mt-6 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-xs">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs font-bold text-gray-800">সকালের ডেলিভারি</p>
            <p className="text-[10px] text-gray-500 mt-0.5">অর্ডার অনুযায়ী তাজা কাটা</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-xs">
            <div className="text-2xl mb-1">🧼</div>
            <p className="text-xs font-bold text-gray-800">১০০% স্বাস্থ্যসম্মত</p>
            <p className="text-[10px] text-gray-500 mt-0.5">ক্লিন ও ভ্যাকুয়াম প্যাকড</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-xs">
            <div className="text-2xl mb-1">💵</div>
            <p className="text-xs font-bold text-gray-800">ক্যাশ ও UPI</p>
            <p className="text-[10px] text-gray-500 mt-0.5">COD ও QR পেমেন্ট সুবিধা</p>
          </div>
        </div>
      </section>
    </div>
  );
            }
      
