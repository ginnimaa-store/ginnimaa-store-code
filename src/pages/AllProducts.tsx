import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import { ProductCard } from '@/components/ProductCard';

export function AllProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const searchQuery = searchParams.get('search') || '';
  const categorySlug = searchParams.get('category') || '';
  const filterType = searchParams.get('filter') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, categories(*)').eq('active', true);
    if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    if (filterType === 'offer') query = query.eq('is_on_offer', true);
    if (filterType === 'bestseller') query = query.eq('is_best_seller', true);
    if (categorySlug) {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
      if (cat) query = query.eq('category_id', cat.id);
    }
    const { data } = await query.order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }, [searchQuery, categorySlug, filterType]);

  useEffect(() => {
    supabase.from('categories').select('*').order('display_order').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('filter');
    if (slug) params.set('category', slug); else params.delete('category');
    setSearchParams(params);
    setShowFilter(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{searchQuery ? `"${searchQuery}" এর ফলাফল` : 'সকল পণ্য'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{products.length}টি পণ্য পাওয়া গেছে</p>
        </div>
        <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
          {showFilter ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          <span>ফিল্টার</span>
        </button>
      </div>

      {showFilter && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 flex flex-wrap gap-2">
          <button onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!categorySlug ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>সব পণ্য</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategory(c.slug)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${categorySlug === c.slug ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{c.name}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 p-6">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-gray-800">কোনো পণ্য পাওয়া যায়নি</h2>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
        }
        
