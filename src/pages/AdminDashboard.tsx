import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, Package, Store, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { AdminOrders } from '@/components/AdminOrders';
import { AdminProducts } from '@/components/AdminProducts';
import { AdminSettings } from '@/components/AdminSettings';
import { useLang } from '@/context/LanguageContext';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');
  const [metrics, setMetrics] = useState({ totalOrders: 0, totalSales: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, prodRes] = await Promise.all([
          supabase.from('orders').select('id, total'),
          supabase.from('products').select('id', { count: 'exact', head: true })
        ]);
        const orders = ordersRes.data || [];
        const sales = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        setMetrics({ totalOrders: orders.length, totalSales: sales, totalProducts: prodRes.count || 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tabLabels: Record<string, string> = {
    overview: t('ওভারভিউ', 'Overview'),
    orders: t('অর্ডার', 'Orders'),
    products: t('পণ্য', 'Products'),
    settings: t('সেটিংস', 'Settings'),
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <span className="text-xl font-bold text-emerald-800">GINNIMAA ADMIN</span>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg flex items-center gap-1"><Store className="w-4 h-4"/>{t('স্টোর', 'Store')}</button>
          <button onClick={async () => { await signOut(); navigate('/admin/login'); }} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg flex items-center gap-1"><LogOut className="w-4 h-4"/>{t('লগআউট', 'Logout')}</button>
        </div>
      </header>

      <nav className="bg-white border-b flex px-4 gap-4 overflow-x-auto">
        {(['overview', 'orders', 'products', 'settings'] as const).map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)} className={`py-3 text-sm font-semibold border-b-2 ${tab === tabKey ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'}`}>{tabLabels[tabKey]}</button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'overview' && (
          loading ? <div className="text-center py-12">{t('লোড হচ্ছে...', 'Loading...')}</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border flex items-center gap-4"><DollarSign className="w-8 h-8 text-emerald-600"/><div><p className="text-xs text-gray-500">{t('মোট বিক্রি', 'Total Sales')}</p><p className="text-lg font-bold">{formatPrice(metrics.totalSales)}</p></div></div>
              <div className="bg-white p-5 rounded-xl border flex items-center gap-4"><ShoppingBag className="w-8 h-8 text-blue-600"/><div><p className="text-xs text-gray-500">{t('মোট অর্ডার', 'Total Orders')}</p><p className="text-lg font-bold">{metrics.totalOrders}</p></div></div>
              <div className="bg-white p-5 rounded-xl border flex items-center gap-4"><Package className="w-8 h-8 text-purple-600"/><div><p className="text-xs text-gray-500">{t('মোট প্রোডাক্ট', 'Total Products')}</p><p className="text-lg font-bold">{metrics.totalProducts}</p></div></div>
            </div>
          )
        )}
        {tab === 'orders' && <AdminOrders />}
        {tab === 'products' && <AdminProducts />}
        {tab === 'settings' && <AdminSettings />}
      </main>
    </div>
  );
}
