import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('products').select('category_id').eq('active', true),
      ]);
      setCategories(catRes.data || []);
      const c: Record<string, number> = {};
      (prodRes.data || []).forEach((p: { category_id: string | null }) => {
        if (p.category_id) c[p.category_id] = (c[p.category_id] || 0) + 1;
      });
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">All Categories</h1>
      <div className="space-y-3">
        {categories.map(cat => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug}`}
            className="block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 p-3">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={cat.image_url || ''}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">{cat.description}</p>
                <p className="text-xs text-green-700 font-semibold mt-1">{counts[cat.id] || 0} products</p>
              </div>
              <ArrowRight size={20} className="text-gray-400 group-hover:text-green-700 transition-colors shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
