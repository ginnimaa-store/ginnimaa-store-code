import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Edit, Save, X, Percent } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  selling_price?: number;
  mrp: number;
  category: string;
  image_url: string;
  description: string;
  stock: number;
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // ফর্মের স্টেট
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [category, setCategory] = useState('Fresh');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('10');

  // আপনার চাহিদা অনুযায়ী ক্যাটাগরি ও সাব-ক্যাটাগরি তালিকা
  const categories = [
    'Fresh',
    'Fish',
    'Meat',
    'Vegetables',
    'Spices',
    'Grocery',
    'Pickles',
    'Snacks',
    'Beverages'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (error) throw error;
      if (data) setProducts(data);
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const calculateDiscount = (sellingPrice: string, mrpPrice: string) => {
    const sPrice = parseFloat(sellingPrice);
    const mPrice = parseFloat(mrpPrice);
    if (!isNaN(sPrice) && !isNaN(mPrice) && mPrice > sPrice && mPrice > 0) {
      const discount = ((mPrice - sPrice) / mPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  const discountPercent = calculateDiscount(price, mrp);

  const resetForm = () => {
    setName('');
    setPrice('');
    setMrp('');
    setCategory('Fresh');
    setImageUrl('');
    setDescription('');
    setStock('10');
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPrice = parseFloat(price) || 0;
      const parsedMrp = parseFloat(mrp) || parsedPrice;

      const productData = {
        name,
        price: parsedPrice,
        selling_price: parsedPrice,
        mrp: parsedMrp,
        category,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80',
        description,
        stock: parseInt(stock) || 10
      };

      if (isEditing && currentId) {
        const { error } = await supabase.from('products').update(productData).eq('id', currentId);
        if (error) throw error;
        alert('পণ্য সফলভাবে আপডেট করা হয়েছে!');
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        alert('পণ্য সফলভাবে সংরক্ষিত হয়েছে!');
      }

      resetForm();
      fetchProducts();
    } catch (error: any) {
      alert('সংরক্ষণ ব্যর্থ হয়েছে: ' + error.message);
    }
  };

  const handleEdit = (product: Product) => {
    setName(product.name);
    const pValue = product.selling_price || product.price || 0;
    setPrice(pValue.toString());
    setMrp(product.mrp?.toString() || pValue.toString());
    setCategory(product.category || 'Fresh');
    setImageUrl(product.image_url || '');
    setDescription(product.description || '');
    setStock(product.stock?.toString() || '10');
    setCurrentId(product.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি নিশ্চিত এই পণ্যটি ডিলিট করতে চান?')) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        fetchProducts();
      } catch (error: any) {
        alert('ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">প্রোডাক্ট ম্যানেজমেন্ট</h2>
      </div>

      {/* প্রোডাক্ট ফর্ম */}
      <form onSubmit={handleSaveProduct} className="bg-white p-4 md:p-6 rounded-xl shadow-md mb-8 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          {isEditing ? 'প্রোডাক্ট এডিট করুন' : '+ নতুন প্রোডাক্ট যোগ করুন'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">পণ্যের নাম *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: রুই মাছ / খাসির মাংস / টাজা শাকসবজি"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ক্যাটাগরি নির্বাচন করুন *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">মূল দাম (Selling Price) *</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="যেমন: 250"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-600">পূর্বের দাম (MRP) *</label>
              {discountPercent > 0 && (
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Percent size={12} /> {discountPercent}% ছাড়
                </span>
              )}
            </div>
            <input
              type="number"
              required
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              placeholder="যেমন: 300"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ছবির লিংক (Image URL)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">স্টক পরিমাণ (Stock)</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="10"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">পণ্যের বিবরণ (Description)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="পণ্য সম্পর্কে কিছু লিখুন..."
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          ></textarea>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Save size={18} /> {isEditing ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <X size={18} /> বাতিল
            </button>
          )}
        </div>
      </form>

      {/* প্রোডাক্ট তালিকা */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 p-4 border-b">প্রোডাক্ট তালিকা ({products.length})</h3>
        {loading ? (
          <p className="p-6 text-center text-gray-500">লোড হচ্ছে...</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-center text-gray-500">কোনো পণ্য পাওয়া যায়নি।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="p-3">ছবি</th>
                  <th className="p-3">নাম</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3">দাম ও ছাড়</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const actualPrice = p.selling_price || p.price || 0;
                  const disc = p.mrp && p.mrp > actualPrice ? Math.round(((p.mrp - actualPrice) / p.mrp) * 100) : 0;
                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50 text-sm">
                      <td className="p-3">
                        <img src={p.image_url || 'https://via.placeholder.com/50'} alt={p.name} className="w-12 h-12 object-cover rounded-md border" />
                      </td>
                      <td className="p-3 font-medium text-gray-800">{p.name}</td>
                      <td className="p-3">
                        <span className="bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full font-medium">{p.category || 'General'}</span>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-900 font-semibold">৳{actualPrice}</div>
                        {p.mrp > actualPrice && (
                          <div className="text-xs text-gray-500 flex items-center gap-1.5">
                            <span className="line-through">৳{p.mrp}</span>
                            <span className="text-green-600 font-bold">({disc}% off)</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 flex gap-2 items-center">
                        <button onClick={() => handleEdit(p)} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100" title="এডিট">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100" title="ডিলিট">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
    }
         
