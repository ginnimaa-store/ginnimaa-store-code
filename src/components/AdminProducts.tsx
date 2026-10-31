import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Package, Loader2, AlertTriangle, Scale } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/format';
import { ProductForm } from './ProductForm';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(*)')
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('categories').select('*').order('display_order');
      setCategories(data || []);
    })();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('products').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    fetchProducts();
  };

  const toggleActive = async (product: Product) => {
    await supabase.from('products').update({ active: !product.active }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryName = (id: string | null) => {
    const cat = categories.find(c => c.id === id);
    return cat?.name || 'ক্যাটাগরি ছাড়া';
  };

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="পণ্য বা মাছ-মাংস খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs sm:text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl text-xs sm:text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">সব ক্যাটাগরি</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-800 transition-colors shrink-0 shadow-xs"
        >
          <Plus size={18} /> নতুন পণ্য যোগ করুন
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100">
          <Package size={40} className="mx-auto text-gray-300" />
          <p className="font-medium mt-2">কোনো পণ্য পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => {
            const discount = calculateDiscount(product.mrp, product.selling_price);
            const weightText = product.net_weight
              ? `${product.net_weight}${product.weight_unit === 'kg' ? 'কেজি' : product.weight_unit === 'gm' ? 'গ্রাম' :
                                
