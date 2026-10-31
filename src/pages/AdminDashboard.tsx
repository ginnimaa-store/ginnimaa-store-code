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
              className="flex items-center gap-1
            
