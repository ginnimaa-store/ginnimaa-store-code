import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="bg-green-700 text-white text-center text-xs py-1.5 px-4 font-medium">
        Free delivery on orders above ₹199
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-bold text-green-700 tracking-tight">GINNIMAA</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 text-gray-700"
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/cart" className="relative p-1.5 text-gray-700">
              <ShoppingCart size={24} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
        <form onSubmit={handleSearch} className="mt-3 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for spices, dal, oil..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition-all"
          />
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </form>
        {menuOpen && (
          <nav className="md:hidden mt-3 py-2 border-t border-gray-100 flex flex-col gap-1">
            <Link to="/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg">Home</Link>
            <Link to="/products" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg">All Products</Link>
            <Link to="/categories" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg">Categories</Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg">Cart ({count})</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
