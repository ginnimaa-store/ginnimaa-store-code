import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, Package, Store, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminOrders } from '@/components/AdminOrders';
import { AdminProducts } from '@/components/AdminProducts';
import { AdminSettings } from '@/components/AdminSettings';

type Tab = 'orders' | 'products' | 'settings';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-green-700">GINNIMAA</span>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Store size={16} /> <span className="hidden sm:inline">View Store</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        {/* Tab navigation */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('orders')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'orders'
                  ? 'border-green-700 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingBag size={16} /> Orders
            </button>
            <button
              onClick={() => setTab('products')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'products'
                  ? 'border-green-700 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package size={16} /> Products
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'settings'
                  ? 'border-green-700 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle size={16} /> Settings
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {tab === 'orders' && <AdminOrders />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
