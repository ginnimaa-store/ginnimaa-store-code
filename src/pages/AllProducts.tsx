import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, categories(*)').eq('active', true);
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }
    if (categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .maybeSingle();
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }
    const { data } = await query.order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }, [searchQuery, categorySlug]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('categories').select('*').order('display_order');
      setCategories(data || []);
    })();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
    setShowFilter(false);
  };

  const activeCategory = categories.find(c => c.slug === categorySlug);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {searchQuery ? `Results for "${searchQuery}"` : activeCategory ? activeCategory.name : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} items found</p>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
        >
          <SlidersHorizontal size={16} /> Filter
        </button>
      </div>

      {showFilter && (
        <div className="mb-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Categories</h3>
            <button onClick={() => setShowFilter(false)} className="text-gray-400">
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !categorySlug
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  categorySlug === cat.slug
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
