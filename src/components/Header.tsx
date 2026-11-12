import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

export function Header() {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const count = getItemCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // কাস্টমার সেশন চেক করার সাধারণ উপায়
  const isCustomerLoggedIn = localStorage.getItem('ginnimaa_session');

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="bg-amber-600 text-white text-center text-xs py-1.5 px-4 font-medium tracking-wide">
        🔥 বিশেষ অফার: ২০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি!
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-black text-amber-600 tracking-tight">GINNIMAA</span>
          </Link>
          
          <div className="flex items-center gap-2.5">
            {/* কাস্টমার অথ বা প্রোফাইল বাটন */}
            {isCustomerLoggedIn ? (
              <Link
                to="/profile"
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-xl text-xs font-bold border border-amber-200 transition-colors shadow-2xs"
              >
                <User size={15} /> প্রোফাইল
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-2xs"
              >
                <User size={15} /> লগইন
              </Link>
            )}

            <Link to="/cart" className="relative p-1.5 text-gray-700 hover:text-amber-600 transition-colors">
              <ShoppingCart size={24} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-2xs">
                  {count}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 text-gray-700"
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-3 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="তাজা মাছ, মাংস বা অন্যান্য পণ্য খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 rounded-xl text-sm border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600" />
        </form>

        {menuOpen && (
          <nav className="md:hidden mt-3 py-2 border-t border-amber-100 flex flex-col gap-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-gray-700 font-medium hover:bg-amber-50 rounded-lg">Home</Link>
            <Link to="/products" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-gray-700 font-medium hover:bg-amber-50 rounded-lg">All Products</Link>
            <Link to="/categories" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-gray-700 font-medium hover:bg-amber-50 rounded-lg">Categories</Link>
            <Link to={isCustomerLoggedIn ? "/profile" : "/auth"} onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-amber-800 font-bold hover:bg-amber-50 rounded-lg">
              {isCustomerLoggedIn ? "My Profile" : "Customer Login / Signup"}
            </Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-gray-700 font-medium hover:bg-amber-50 rounded-lg">Cart ({count})</Link>
          </nav>
        )}
      </div>
    </header>
  );
            }
          
