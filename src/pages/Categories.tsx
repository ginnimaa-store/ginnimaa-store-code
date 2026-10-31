import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').order('display_order'),
          supabase.from('products').select('category_id').eq('active', true),
        ]);

        const dbCategories = catRes.data || [];
        setCategories(dbCategories);

        const c: Record<string, number> = {};
        (prodRes.data || []).forEach((p: { category_id: string | null }) => {
          if (p.category_id) c[p.category_id] = (c[p.category_id] || 0) + 1;
        });
        setCounts(c);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="text-emerald-700" size={22} />
        <h1 className="text-xl font-bold text-gray-900">সব ক্যাটাগরি সমূহ</h1>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
          <p className="text-base font-semibold text-gray-800">কোনো ক্যাটাগরি পাওয়া যায়নি</p>
          <p className="text-xs text-gray-400 mt-1">অ্যাডমিন প্যানেল থেকে নতুন ক্যাটাগরি তৈরি করুন</p>
        </div>
          
