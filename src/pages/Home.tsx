import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, TrendingUp, Sparkles } from 'lucide-react';
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
      setLoading(false);
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
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-700 to-green-900 m-4 rounded-3xl p-6 md:p-10 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold leading-tight">
            Authentic Bengali Flavors,<br />Delivered to Your Door
          </h1>
          <p className="mt-2 text-green-100 text-sm md:text-base">
            Premium spices, grocery, pickles & more from GINNIMAA
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 mt-4 bg-white text-green-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
          >
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 w-48 h-48 md:w-72 md:h-72 rounded-full bg-white/10 -mr-16 -mb-16" />
        <div className="absolute right-12 top-4 w-24 h-24 rounded-full bg-white/5" />
      </div>

      {/* Categories */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Shop by Category</h2>
          <Link to="/categories" className="text-sm text-green-700 font-semibold flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group-hover:border-green-300 transition-all">
                <img
                  src={cat.image_url || ''}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Offers */}
      {offers.length > 0 && (
        <section className="px-4 mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Special Offers</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {offers.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="px-4 mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Featured Products</h2>
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
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={20} className="text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">Best Sellers</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {bestSellers.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Trust badges */}
      <section className="px-4 mt-6 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-2xl mb-1">🚚</div>
            <p className="text-xs font-semibold text-gray-700">Fast Delivery</p>
            <p className="text-[10px] text-gray-400 mt-0.5">COD available</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-2xl mb-1">✓</div>
            <p className="text-xs font-semibold text-gray-700">Pure & Fresh</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Quality assured</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-2xl mb-1">↺</div>
            <p className="text-xs font-semibold text-gray-700">Easy Returns</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Hassle-free</p>
          </div>
        </div>
      </section>
    </div>
  );
}
