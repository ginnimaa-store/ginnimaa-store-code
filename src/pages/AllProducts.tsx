import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Tag, Sparkles, TrendingUp } from 'lucide-react';
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
  const filterType = searchParams.get('filter') || ''; // 'offer' বা 'bestseller'

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, categories(*)').eq('active', true);

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    if (filterType === 'offer') {
      query = query.eq('is_on_offer', true);
    } else if (filterType === 'bestseller') {
      query = query.eq('is_best_seller', true);
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
  }, [searchQuery, categorySlug, filterType]);

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
    params.delete('filter');
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
    setShowFilter(false);
  };

  const setSpecialFilter = (type: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('category');
    if (type) {
      params.set('filter', type);
    } else {
      params.delete('filter');
    }
    setSearchParams(params);
    setShowFilter(false);
  };

  const activeCategory = categories.find(c => c.slug === categorySlug);

  const getPageTitle = () => {
    if (searchQuery) return `"${searchQuery}" এর ফলাফল`;
    if (filterType === 'offer') return 'সেরা অফার ও ছাড়ের পণ্য';
    if (filterType === 'bestseller') return 'বেস্ট সেলার ও জনপ্রিয় পণ্য';
    if (activeCategory) return activeCategory.name;
    return 'সকল পণ্য';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Title & Filter Trigger */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{products.length}টি পণ্য পাওয়া গেছে</p>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
        >
          {showFilter ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          <span>{showFilter ? 'ফিল্টার বন্ধ' : 'ফিল্টার'}</span>
        </button>
      </div>

      {/* Filter drawer / section */}
      {showFilter && (
        <div className="mb-6 p
      
