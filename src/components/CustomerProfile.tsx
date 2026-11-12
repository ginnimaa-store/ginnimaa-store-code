import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Phone, Mail, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';

export function CustomerProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDataAndOrders();
  }, []);

  const fetchUserDataAndOrders = async () => {
    setLoading(true);
    const sessionData = localStorage.getItem('ginnimaa_session');
    if (!sessionData) {
      navigate('/auth');
      return;
    }

    const session = JSON.parse(sessionData);
    const currentUser = session?.user;
    setUser(currentUser);

    if (currentUser && currentUser.email) {
      const { data: customerOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('mobile_number', currentUser.user_metadata?.mobile || '')
        .order('created_at', { ascending: false });

      if (!error && customerOrders) {
        setOrders(customerOrders);
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('ginnimaa_session');
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={32} className="animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 font-bold text-2xl">
            {user?.user_metadata?.full_name?.charAt(0) || 'C'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.user_metadata?.full_name || 'কাস্টমার'}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 justify-center md:justify-start">
              <Mail size={13} /> {user?.email}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 justify-center md:justify-start">
              <Phone size={13} /> {user?.user_metadata?.mobile || 'নম্বর যুক্ত নেই'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs rounded-xl transition-colors"
        >
          <LogOut size={16} /> লগ আউট
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Package size={20} className="text-emerald-700" /> আপনার অর্ডার হিস্ট্রি ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">আপনি এখনো কোনো অর্ডার করেননি</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-emerald-800">{order.order_number}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ঠিকানা: {order.address}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">তারিখ: {new Date(order.created_at).toLocaleString('en-IN')}</p>
                </div>

                <div className="text-right w-full md:w-auto flex md:flex-col justify-between items-center md:items-end border-t md:border-t-0 pt-2 md:pt-0 border-gray-200">
                  <span className="font-extrabold text-sm text-gray-900">{formatPrice(order.total)}</span>
                  <span className="text-[11px] text-gray-500">{order.payment_method}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
        }
      
