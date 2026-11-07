import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .order('display_order');
        setCategories(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">সকল ক্যাটাগরি</h1>
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white p-4 rounded-xl border border-gray-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition text-center"
            >
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-16 h-16 mx-auto object-contain mb-3 group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg mb-3">
                  {cat.name.charAt(0)}
                </div>
              )}
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition text-sm">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
              }
