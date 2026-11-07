import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  ShoppingBag, 
  Package, 
  Store, 
  Settings, 
  Tags, 
  MapPin, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  DollarSign 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { AdminOrders } from '@/components/AdminOrders';
import { AdminProducts } from '@/components/AdminProducts';
import { AdminSettings } from '@/components/AdminSettings';

type Tab = 'overview' | 'orders' | 'products' | 'categories' | 'pincodes' | 'settings';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  // ড্যাশবোর্ড মেট্রিক্স স্টেট
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSales: 0,
    totalProducts: 0
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from('orders').select('id, total, status'),
          supabase.from('products').select('id', { count: 'exact', head: true })
        ]);

        const orders = ordersRes.data || [];
        const totalSales = orders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
        const pending = orders.filter(o => o.status === 'New' || o.status === 'PLACED' || o.status === 'PENDING').length;
        const delivered = orders.filter(o => o.status === 'DELIVERED').length;

        setMetrics({
          totalOrders: orders.length,
          pendingOrders: pending,
          deliveredOrders: delivered,
          totalSales,
          totalProducts: productsRes.count || 0
        });
      } catch (err) {
        console.error('Error fetching admin metrics:', err);
      } finally {
        setLoadingMetrics(false);
      }
    }
    loadOverview();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-black text-emerald-800 tracking-tight">GINNIMAA</span>
            <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md">
              অ্যাডমিন কন্ট্রোল
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Store className="w-4 h-4" />
              <span>স্টোর দেখুন</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setTab('overview')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              tab === 'overview'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ওভারভিউ
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              tab === 'orders'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            অর্ডার সমূহ
          </button>
          <button
            onClick={() => setTab('products')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              tab === 'products'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            প্রোডাক্ট তালিকা
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              tab === 'settings'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            সেটিংস
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {tab === 'overview' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">স্টোর ওভারভিউ</h1>
            {loadingMetrics ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
          
