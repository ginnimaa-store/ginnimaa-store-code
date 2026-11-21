import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, User, Languages, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useLang } from '@/context/LanguageContext';
import { LeftDrawer } from './LeftDrawer';
import { RightDrawer } from './RightDrawer';

export function Header() {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const count = getItemCount();
  const { lang, toggle, t } = useLang();

  const isCustomerLoggedIn = localStorage.getItem('ginnimaa_session');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <LeftDrawer open={leftOpen} onClose={() => setLeftOpen(false)} />
      <RightDrawer open={rightOpen} onClose={() => setRightOpen(false)} />

      <header className="sticky top-0 z-40 bg-white shadow-md">
        <div className="bg-amber-600 text-white text-center text-xs py-1.5 px-4 font-medium tracking-wide">
          {t('বিশেষ অফার: ২০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি!', 'Special Offer: Free delivery on orders above Rs.200!')}
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left hamburger */}
            <button
              onClick={() => setLeftOpen(true)}
              className="p-1.5 text-gray-700 hover:text-amber-600 transition-colors"
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>

            <Link to="/" className="flex items-center gap-1.5 shrink-0 cursor-pointer" aria-label="GINNIMAA home">
              <img
                src="/assets/Ginnimaa_Header_Logo_400px.png"
                alt="GINNIMAA"
                className="h-12 w-12 md:h-14 md:w-14 object-contain"
              />
              <span className="text-xl md:text-2xl font-black text-amber-600 tracking-tight">GINNIMAA</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <button
                onClick={toggle}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-100 transition-colors"
                aria-label="Language"
              >
                <Languages size={14} /> {lang === 'bn' ? 'EN' : 'বাংলা'}
              </button>

              {/* Customer auth */}
              {isCustomerLoggedIn ? (
                <Link to="/profile" className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-xl text-xs font-bold border border-amber-200 transition-colors shadow-2xs">
                  <User size={15} /> {t('প্রোফাইল', 'Profile')}
                </Link>
              ) : (
                <Link to="/auth" className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-2xs">
                  <User size={15} /> {t('লগইন', 'Login')}
                </Link>
              )}

              <Link to="/cart" className="relative p-1.5 text-gray-700 hover:text-amber-600 transition-colors">
                <ShoppingCart size={22} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-2xs">
                    {count}
                  </span>
                )}
              </Link>

              {/* Right menu button */}
              <button
                onClick={() => setRightOpen(true)}
