import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Product, Category } from '@/types';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('display_order')
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে পণ্যটি মুছে ফেলতে চান?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return;

    if (editingProduct.id) {
      await supabase.from('products').update(editingProduct).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([editingProduct]);
    }
    setEditingProduct(null);
    loadData();
  };

  return (
    <div className="bg-white rounded-xl border p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">প্রোডাক্ট তালিকা</h2>
        <button
          onClick={() => setEditingProduct({ name: '', price: 0, active: true })}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> নতুন প্রোডাক্ট
        </button>
      </div>

      {editingProduct && (
        <form onSubmit={handleSave} className="mb-6 p-4 bg-gray-50 rounded-xl border flex flex-col gap-3">
          <h3 className="font-bold text-sm">{editingProduct.id ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট যুক্ত করুন'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="পণ্যের নাম"
              value={editingProduct.name || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
              className="p-2 border rounded-lg text-sm bg-white"
              required
            />
            <input
              type="number"
              placeholder="মূল্য (Price)"
              value={editingProduct.price || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
              className="p-2 border rounded-lg text-sm bg-white"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="px-3 py-1.5 text-xs border rounded-lg bg-white"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-semibold rounded-lg"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">লোড হচ্ছে...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">কোনো প্রোডাক্ট পাওয়া যায়নি।</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-3">নাম</th>
                <th className="py-3 px-3">মূল্য</th>
                <th className="py-3 px-3">ওজন/ইউনিট</th>
                <th className="py-3 px-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => {
                const weightDisplay = p.net_weight
                  ? `${p.net_weight} ${p.weight_unit || 'g'}`
                  : (p.weight || '-');
                return (
                  <tr key={p.id}>
                    <td className="py-3 px-3 font-medium text-gray-900">{p.name}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">{formatPrice(p.price)}</td>
                    <td className="py-3 px-3 text-gray-500">{weightDisplay}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingProduct(p)} className="p-1 hover:text-blue-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
  
