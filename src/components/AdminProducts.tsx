import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Package, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/format';
import { ProductForm } from './ProductForm';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const categoryName = (id: string | null) => {
    const cat = categories.find(c => c.id === id);
    return cat?.name || 'Uncategorized';
  };

  return (
    <div>
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors shrink-0"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package size={40} className="mx-auto text-gray-300" />
          <p className="font-medium mt-2">No products found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => {
            const discount = calculateDiscount(product.mrp, product.selling_price);
            return (
              <div key={product.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={product.image_url || ''}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
                      {!product.active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Hidden</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{categoryName(product.category_id)} • {product.pack_size}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-bold text-green-700 text-sm">{formatPrice(product.selling_price)}</span>
                      {discount > 0 && <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>}
                      <span className="text-xs text-gray-400">Stock: {product.stock}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(product)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        product.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {product.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">Featured</span>}
                    {product.is_best_seller && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Best Seller</span>}
                    {product.is_on_offer && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">On Offer</span>}
                  </div>
                  <button
                    onClick={() => setDeleteTarget(product)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchProducts();
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Delete Product?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete "{deleteTarget.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
