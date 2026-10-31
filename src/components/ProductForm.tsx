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
  const [netWeight, setNetWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'gm' | 'kg' | 'piece'>('gm');
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
      setNetWeight(product.net_weight ? String(product.net_weight) : '');
      setWeightUnit((product.weight_unit as 'gm' | 'kg' | 'piece') || 'gm');
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
      setError('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে');
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
      setError('ছবি আপলোড করা যায়নি। সরাসরি ছবির লিংক (URL) দিতে পারেন।');
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
      setError('পণ্যের নাম অবশ্যই দিতে হবে');
      return;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      setError('বিক্রয়মূল্য (Selling price) শূন্যের বেশি হতে হবে');
      return;
    }
    if (!mrp || Number(mrp) <= 0) {
      setError('MRP শূন্যের বেশি হতে হবে');
      return;
    }

    setSaving(true);

    const payload: Record<string, any> = {
      name: name.trim(),
      description: description.trim() || null,
      short_description: shortDescription.trim() || null,
      category_id: categoryId || null,
      image_url: imageUrl || null,
      mrp: Number(mrp),
      selling_price: Number(sellingPrice),
      pack_size: packSize.trim() || (netWeight ? `${netWeight} ${weightUnit}` : null),
      net_weight: netWeight ? Number(netWeight) : null,
      weight_unit: weightUnit,
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
      setError('পণ্য সংরক্ষণ করা সম্ভব হয়নি। ডাটাবেজ ফিল্ড যাচাই করুন।');
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
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between z-10">
          <h3 className="font-bold text-gray-900 text-base md:text-lg">
            {isEdit ? 'পণ্য সম্পাদনা করুন' : 'নতুন পণ্য যোগ করুন'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-2">পণ্যের ছবি</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={26} className="text-gray-300" />
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
                  className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 rounded-xl text-xs md:text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> আপলোড হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Upload size={15} /> ছবি আপলোড করুন
                    </>
                  )}
                </button>
                <p className="text-[11px] text-gray-400 mt-1">PNG, JPG (সর্বোচ্চ 5MB)</p>
              </div>
            </div>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="অথবা সরাসরি ছবির অনলাইন লিংক (URL) দিন"
              className="mt-2 w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
          </div>

          <div>
            <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">পণ্যের নাম *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="যেমন: তাজা রুই মাছ (কাটা) বা কচি খাসির মাংস"
              className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
          </div>

          <div>
            <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">সংক্ষিপ্ত বিবরণ</label>
            <input
              type="text"
              value={shortDescription}
              onChange={e => setShortDescription(e.target.value)}
              placeholder="যেমন: তাজা নদী থেকে সংগ্রহকৃত, পরিষ্কার করা"
              className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
          </div>

          <div>
            <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">ক্যাটাগরি</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            >
              <option value="">ক্যাটাগরি নির্বাচন করুন</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* দাম ও MRP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">MRP (আসল দাম) *</label>
              <input
                type="number"
                value={mrp}
                onChange={e => setMrp(e.target.value)}
                placeholder="যেমন: 350"
                step="0.01"
                className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
            </div>
            <div>
              <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">বিক্রয়মূল্য (Selling Price) *</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                placeholder="যেমন: 310"
                step="0.01"
                className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
            </div>
          </div>

          {/* ওজন ও প্যাক সাইজ */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">ওজন (সংখ্যা)</label>
              <input
                type="number"
                value={netWeight}
                onChange={e => setNetWeight(e.target.value)}
                placeholder="500 বা 1"
                step="0.1"
                className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
            </div>
            <div>
              <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">একক (Unit)</label>
              <select
                value={weightUnit}
                onChange={e => setWeightUnit(e.target.value as 'gm' | 'kg' | 'piece')}
                className="w-full px-2 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              >
                <option value="gm">গ্রাম (gm)</option>
                <option value="kg">কেজি (kg)</option>
                <option value="piece">পিস (piece)</option>
              </select>
            </div>
            <div>
              <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">স্টক পরিমাণ</label>
              <input
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="যেমন: 25"
                className="w-full px-3 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="text-xs md:text-sm font-semibold text-gray-700 block mb-1">প্যাক লেবেল (বিকল্প)</label>
            <input
              type="text"
              value={packSize}
              onChange={e => setPackSize(e.target.value)}
              placeholder="যেমন: 500g Pack বা Whole Fish"
              className="w-full px-3.5 py-2 bg-gray-50 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
          </div>

          {/* টগল অপশনসমূহ */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs md:text-sm font-medium text-gray-700">পণ্য সক্রিয় থাকবে (গ্রাহকরা দেখতে পাবেন)</span>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-emerald-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs md:text-sm font-medium text-gray-700">ফিচার্ড (হোমপেজে স্পেশাল দেখাবে)</span>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isFeatured ? 'bg-emerald-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isFeatured ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs md:text-sm font-medium text-gray-700">বেস্ট সেলার (সেরা বিক্রিত)</span>
              <button
                type="button"
                onClick={() => setIsBestSeller(!isBestSeller)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isBestSeller ? 'bg-amber-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isBestSeller ? 'translate-x-5' : ''}`} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs md:text-sm font-medium text-gray-700">অফার চলছে (স্পেশাল ছাড়ের ট্যাগ)</span>
              <button
                type="button"
                onClick={() => setIsOnOffer(!isOnOffer)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isOnOffer ? 'bg-rose-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isOnOffer ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 text-xs md:text-sm font-medium px-4 py-2.5 rounded-xl border border-rose-100">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs md:text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs md:text-sm bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> সংরক্ষণ হচ্ছে...
                </>
              ) : (
                isEdit ? 'পরিবর্তন সংরক্ষণ করুন' : 'পণ্য যোগ করুন'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  }
      
