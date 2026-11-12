import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, TrendingUp, Sparkles, MapPin, Search, CheckCircle2, AlertCircle, Loader2, Fish, Beef, Drumstick, Star, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // PIN code checker
  const [pinInput, setPinInput] = useState('');
  const [pinStatus, setPinStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [pinArea, setPinArea] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [catRes, featRes, bestRes, offerRes] = await Promise.all([
          supabase.from('categories').select('*').order('display_order'),
          supabase.from('products').select('*').eq('is_featured', true).eq('active', true).limit(8),
          supabase.from('products').select('*').eq('is_best_seller', true).eq('active', true).limit(10),
          supabase.from('products').select('*').eq('is_on_offer', true).eq('active', true).limit(10),
        ]);
        setCategories(catRes.data || []);
        setFeatured(featRes.data || []);
        setBestSellers(bestRes.data || []);
        setOffers(offerRes.data || []);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePinCheck = async () => {
    if (pinInput.length !== 6) return;
    setPinStatus('checking');
    const { data } = await supabase
      .from('serviceable_pincodes')
      .select('area_name, is_active')
      .eq('pin_code', pinInput.trim())
      .maybeSingle();

    if (data && data.is_active) {
      setPinStatus('ok');
      setPinArea(data.area_name);
    } else {
      setPinStatus('fail');
      setPinArea('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const serviceAreas = ['Barasat', 'Madhyamgram'];

  return (
    <div className="max-w-6xl mx-auto bg-amber-50/20 pb-12">
      
      {/* ৫. অ্যাডভারটাইজমেন্ট / নোটিশ বার */}
      <div className="bg-amber-600 text-white text-xs py-2 px-4 text-center font-bold tracking-wide">
        🔥 বিশেষ অফার: ২০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি! বারাসাত, মধ্যমগ্রাম এলাকায় ভোরের তাজা মাছ ও মাংস।
      </div>

      {/* Service Area Info Bar with PIN checker */}
      <div className="m-4 bg-white rounded-2xl p-3 border border-amber-100 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <MapPin size={14} /> সার্ভিস এরিয়া:
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {serviceAreas.map((area, i) => (
              <span key={area} className="text-xs text-gray-600">
                {area}{i < serviceAreas.length - 1 && <span className="text-gray-300 mx-0.5">•</span>}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <input
              type="tel"
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                setPinStatus('idle');
              }}
              placeholder="পিন কোড"
              className="w-24 px-2 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
            <button
              onClick={handlePinCheck}
              disabled={pinInput.length !== 6 || pinStatus === 'checking'}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {pinStatus === 'checking' ? <Loader2 size={12} className="animate-spin" /> : 'চেক'}
            </button>
            {pinStatus === 'ok' && (
              <span className="flex items-center gap-0.5 text-xs text-amber-800 font-medium">
                <CheckCircle2 size={14} /> {pinArea}
              </span>
            )}
            {pinStatus === 'fail' && (
              <span className="flex items-center gap-0.5 text-xs text-rose-600 font-medium">
                <AlertCircle size={14} /> ডেলিভারি নেই
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 mb-2">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="তাজা মাছ, খাসির মাংস, চিকেন খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-xs"
          />
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </form>
        {/* Quick filter tags */}
        <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-none">
          {[
            { label: 'Fresh Water Fish', slug: 'fish' },
            { label: 'Sea Fish', slug: 'sea-fish' },
            { label: 'Chicken', slug: 'chicken' },
            { label: 'Mutton', slug: 'mutton' },
            { label: 'Eggs', slug: 'eggs' },
          ].map(tag => (
            <Link
              key={tag.slug}
              to={`/products?category=${tag.slug}`}
              className="px-3 py-1 bg-white border border-amber-200 rounded-full text-xs font-medium text-gray-700 hover:border-amber-400 hover:text-amber-800 whitespace-nowrap transition-colors"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Hero Banner (Yellow & Amber Theme) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 m-4 rounded-3xl p-6 md:p-10 text-gray-900 shadow-md">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 backdrop-blur-md rounded-full text-xs font-bold text-amber-900 mb-3 shadow-xs">
            <MapPin size={13} /> ভোরের তাজা স্টক ও হোম ডেলিভারি
          </div>
          <h1 className="text-2xl md:text-4xl font-black leading-tight text-gray-900">
            তাজা মাছ ও খাঁটি মাংস,<br />সরাসরি আপনার দরজায়
          </h1>
          <p className="mt-2 text-amber-950 text-sm md:text-base font-medium">
            ভোরের কাটা ফ্রেশ মাছ, সুগুনা ও দেশি মুরগি ও টাটকা খাসির মাংস — দ্রুত ও স্বাস্থ্যসম্মত হোম ডেলিভারি
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm"
            >
              এখনই অর্ডার করুন <ArrowRight size={16} />
            </Link>
            <Link
              to="/products?category=fish"
              className="inline-flex items-center gap-1.5 bg-white/80 hover:bg-white text-amber-900 px-4 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors shadow-xs"
            >
              <Fish size={16} /> তাজা মাছ
            </Link>
            <Link
              to="/products?category=chicken"
              className="inline-flex items-center gap-1.5 bg-white/80 hover:bg-white text-amber-900 px-4 py-2.5 rounded-xl font-bold text-sm border border-amber-300 transition-colors shadow-xs"
            >
              <Drumstick size={16} /> মাংস
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 w-48 h-48 md:w-80 md:h-80 rounded-full bg-white/20 -mr-16 -mb-16 pointer-events-none" />
      </div>

      {/* Fresh Fish & Meat Quick Category Banners */}
      <section className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Link
          to="/products?category=fish"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 p-4 text-white shadow hover:shadow-md transition-all group"
        >
          <div className="relative z-10">
            <Fish size={28} className="text-white" />
            <h3 className="font-bold text-base md:text-lg mt-1">তাজা মাছ</h3>
            <p className="text-[11px] md:text-xs text-amber-100 mt-0.5">রুই, কাতলা, ইলিশ, চিংড়ি ও জ্যান্ত মাছ</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white mt-2 group-hover:translate-x-1 transition-transform">
              সব মাছ দেখুন <ArrowRight size={12} />
            </span>
          </div>
        </Link>

        <Link
          to="/products?category=chicken"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-700 to-amber-900 p-4 text-white shadow hover:shadow-md transition-all group"
        >
          <div className="relative z-10">
            <Beef size={28} className="text-amber-200" />
            <h3 className="font-bold text-base md:text-lg mt-1">ফ্রেশ মাংস</h3>
            <p className="text-[11px] md:text-xs text-amber-200 mt-0.5">ফার্ম ও দেশি চিকেন, কচি খাসির মাংস</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 mt-2 group-hover:translate-x-1 transition-transform">
              মাংসের তালিকা <ArrowRight size={12} />
            </span>
          </div>
        </Link>
      </section>

      {/* Categories */}
      <section className="px-4 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">ক্যাটাগরি সমূহ</h2>
          <Link to="/categories" className="text-sm text-amber-800 font-semibold flex items-center gap-1 hover:underline">
            সব দেখুন <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white border border-amber-100 group-hover:border-amber-400 group-hover:shadow transition-all">
                <img
                  src={cat.image_url || ''}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight group-hover:text-amber-800 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Special Offers */}
      {offers.length > 0 && (
        <section className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag size={20} className="text-red-500" />
              <h2 className="text-lg font-bold text-gray-900">সেরা অফার ও ছাড়</h2>
            </div>
            <Link to="/products" className="text-xs text-gray-500 font-medium hover:text-amber-800">আরও দেখুন</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {offers.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">জনপ্রিয় পছন্দসমূহ</h2>
            </div>
            <Link to="/products" className="text-xs text-gray-500 font-medium hover:text-amber-800">আরও দেখুন</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {featured.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">সবচেয়ে বেশি বিক্রিত</h2>
            </div>
            <Link to="/products" className="text-xs text-gray-500 font-medium hover:text-amber-800">আরও দেখুন</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {bestSellers.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Customer Review Section */}
      <section className="px-4 mt-8">
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Star className="text-amber-500 fill-amber-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900">কাস্টমারদের মতামত ও রেটিং</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-4">
              <div className="flex text-amber-500 text-xs mb-1">⭐⭐⭐⭐⭐</div>
              <p className="text-xs text-gray-700 italic">"মাছের সাইজ ও টাটকা ভাব একদম বাজারের মতো ফ্রেশ পেয়েছি। ডেলিভারিও খুব দ্রুত হয়েছে।"</p>
              <p className="text-[11px] font-bold text-gray-900 mt-2">— সুস্মিতা রায়, মধ্যমগ্রাম</p>
            </div>
            
            <div className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-4">
              <div className="flex text-amber-500 text-xs mb-1">⭐⭐⭐⭐⭐</div>
              <p className="text-xs text-gray-700 italic">"খাসির মাংস অসাধারণ ছিল। প্যাকেজিং খুব পরিষ্কার-পরিচ্ছন্ন লেগেছে।"</p>
              <p className="text-[11px] font-bold text-gray-900 mt-2">— অর্ঘ্য সেনগুপ্ত, বারাসাত</p>
            </div>

            <div className="bg-amber-50/50 border border-amber-100/80 rounded-2xl p-4">
              <div className="flex text-amber-500 text-xs mb-1">⭐⭐⭐⭐⭐</div>
              <p className="text-xs text-gray-700 italic">"অনলাইনে ফ্রেশ মাছ অর্ডার করার জন্য সেরা সার্ভিস। ২০০ টাকার ওপর ডেলিভারি ফ্রি পাওয়াটা দারুণ ব্যাপার।"</p>
              <p className="text-[11px] font-bold text-gray-900 mt-2">— প্রিয়াঙ্কা দাস, হৃদয়পুর</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Video Section */}
      <section className="px-4 mt-8">
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Video className="text-amber-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">আমাদের তাজা পণ্য ও রান্নার রেসিপি ভিডিও</h2>
          </div>
          <div className="w-full rounded-2xl overflow-hidden bg-gray-100 aspect-video">
            <iframe
              className="w-full h-full rounded-2xl object-cover"
              src="https://www.youtube.com/embed/videoseries?list=PLrAXtmRdnEQy6nuQy9qIqM0qKzv6yJqBq" 
              title="Ginnimaa Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-4 mt-8 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center border border-amber-100 shadow-xs">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs font-bold text-gray-800">সকালে ও সন্ধ্যায় ডেলিভারি</p>
            <p className="text-[10px] text-gray-500 mt-0.5">অর্ডার অনুযায়ী তাজা কাটা</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-amber-100 shadow-xs">
            <div className="text-2xl mb-1">🧼</div>
            <p className="text-xs font-bold text-gray-800">১০০% স্বাস্থ্যসম্মত</p>
            <p className="text-[10px] text-gray-500 mt-0.5">ক্লিন ও ভ্যাকুয়াম প্যাকড</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-amber-100 shadow-xs">
            <div className="text-2xl mb-1">💵</div>
            <p className="text-xs font-bold text-gray-800">ক্যাশ ও UPI</p>
            <p className="text-[10px] text-gray-500 mt-0.5">COD ও QR পেমেন্ট সুবিধা</p>
          </div>
        </div>
      </section>
    </div>
  );
      }
            
