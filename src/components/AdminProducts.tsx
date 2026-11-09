import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // categories টেবিল জয়েন বাদ দিয়ে সরাসরি products লোড করা যাতে কোনো রিলেশন সমস্যা না করে
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('লোড এরর:', error);
      } else {
        setProducts(data || []);
      }
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
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('পণ্য মুছতে সমস্যা হয়েছে: ' + error.message);
      return;
    }
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) {
      alert('দয়া করে পণ্যের নাম ও মূল্য পূরণ করুন।');
      return;
    }

    setSaving(true);
    try {
      // ডাটাবেসে সেভ করার জন্য শুধু প্রয়োজনীয় ফিল্ড পাঠানো
      const productPayload: Record<string, any> = {
        name: editingProduct.name.trim(),
        price: Number(editingProduct.price),
        active: true,
      };

      if (editingProduct.description) productPayload.description = editingProduct.description;
      if (editingProduct.image_url) productPayload.image_url = editingProduct.image_url;
      if (editingProduct.weight) productPayload.weight = editingProduct.weight;

      if (editingProduct.id) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productPayload]);

        if (error) throw error;
      }

      alert('পণ্য সফলভাবে সংরক্ষিত হয়েছে!');
      setEditingProduct(null);
      await loadData();
    } catch (err: any) {
      console.error('সেভ করতে সমস্যা:', err);
      alert('সংরক্ষণ ব্যর্থ হয়েছে: ' + (err.message || 'অজানা ত্রুটি'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">প্রোডাক্ট তালিকা</h2>
        <button
          onClick={() => setEditingProduct({ name: '', price: 0 })}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> নতুন প্রোডাক্ট
        </button>
      </div>

      {editingProduct && (
        <form onSubmit={handleSave} className="mb-6 p-4 bg-gray-50 rounded-xl border flex flex-col gap-3">
          <h3 className="font-bold text-sm">
            {editingProduct.id ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">পণ্যের নাম *</label>
              <input
                type="text"
                placeholder="পণ্যের নাম (যেমন: রুই মাছ)"
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full p-2 border rounded-lg text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">মূল্য (Price) *</label>
              <input
                type="number"
                placeholder="মূল্য (যেমন: 250)"
                value={editingProduct.price || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                className="w-full p-2 border rounded-lg text-sm bg-white"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="px-3 py-1.5 text-xs border rounded-lg bg-white"
              disabled={saving}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
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
                <th className="py-3 px-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 px-3 font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700">{formatPrice(p.price)}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
      }
            
