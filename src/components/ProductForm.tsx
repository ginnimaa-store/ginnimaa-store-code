import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductForm({ product, categories, onClose, onSaved }: ProductFormProps) {
  const isEdit = !!product;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [packSize, setPackSize] = useState('');
  const [stock, setStock] = useState('');
  const [active, setActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isOnOffer, setIsOnOffer] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setShortDescription(product.short_description || '');
      setCategoryId(product.category_id || '');
      setImageUrl(product.image_url || '');
      setMrp(String(product.mrp || ''));
      setSellingPrice(String(product.selling_price || ''));
      setPackSize(product.pack_size || '');
      setStock(String(product.stock ?? ''));
      setActive(product.active);
      setIsFeatured(product.is_featured);
      setIsBestSeller(product.is_best_seller);
      setIsOnOffer(product.is_on_offer);
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setUploading(true);
    setError('');

    const ext = file.name.split('.').pop();
    const fileName = `product-${Date.now()}.${ext}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      setError('Failed to upload image. Please try again.');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    setImageUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      setError('Selling price must be greater than 0');
      return;
    }
    if (!mrp || Number(mrp) <= 0) {
      setError('MRP must be greater than 0');
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      short_description: shortDescription.trim() || null,
      category_id: categoryId || null,
      image_url: imageUrl || null,
      mrp: Number(mrp),
      selling_price: Number(sellingPrice),
      pack_size: packSize.trim() || null,
      stock: Number(stock) || 0,
      active,
      is_featured: isFeatured,
      is_best_seller: isBestSeller,
      is_on_offer: isOnOffer,
    };

    let result;
    if (isEdit && product) {
      result = await supabase.from('products').update(payload).eq('id', product.id).select().single();
    } else {
      result = await supabase.from('products').insert(payload).select().single();
    }

    setSaving(false);

    if (result.error) {
      setError('Failed to save product. Please try again.');
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="text-gray-400">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Product Image</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={28} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Upload Image
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-1.5">PNG, JPG up to 5MB</p>
              </div>
            </div>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Or paste image URL"
              className="mt-2 w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cumin Seeds (Jeera)"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={e => setShortDescription(e.target.value)}
              placeholder="One-line description shown on cards"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed product description"
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">MRP *</label>
              <input
                type="number"
                value={mrp}
                onChange={e => setMrp(e.target.value)}
                placeholder="85"
                step="0.01"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Selling Price *</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                placeholder="72"
                step="0.01"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Pack Size</label>
              <input
                type="text"
                value={packSize}
                onChange={e => setPackSize(e.target.value)}
                placeholder="200g"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Stock</label>
              <input
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Active (visible to customers)</span>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : ''}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Featured</span>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isFeatured ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isFeatured ? 'translate-x-5' : ''}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Best Seller</span>
              <button
                type="button"
                onClick={() => setIsBestSeller(!isBestSeller)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isBestSeller ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isBestSeller ? 'translate-x-5' : ''}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700">On Offer</span>
              <button
                type="button"
                onClick={() => setIsOnOffer(!isOnOffer)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isOnOffer ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isOnOffer ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-green-700 text-white hover:bg-green-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving...
                </>
              ) : (
                isEdit ? 'Save Changes' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
