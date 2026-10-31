import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Grid, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export function BottomNav() {
  const location = useLocation();
  const { getItemCount } = useCart();
  const count = getItemCount();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/categories', icon: Grid, label: 'Categories' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: count },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => {
          const active = isActive(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? 'text-green-700' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
