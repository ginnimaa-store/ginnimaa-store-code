import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, MapPin, Phone, Navigation, KeyRound, LogOut, Loader2,
  CheckCircle, X, User, Truck, ClipboardCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';

interface DeliveryOrder {
  id: string;
  order_number: string;
  customer_name: string;
  mobile_number: string;
  address: string;
  pin_code: string;
  total: number;
  status: string;
  delivery_status: string;
  delivery_otp: string;
  payment_method: string;
  customer_lat: number | null;
  customer_lng: number | null;
  created_at: string;
}

interface DeliveryOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; image_url: string | null; pack_size: string | null } | null;
}

export function DeliveryPartner() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({});
  const [otpSuccess, setOtpSuccess] = useState<Record<string, boolean>>({});
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [selectedItems, setSelectedItems] = useState<DeliveryOrderItem[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthChecked(true);
        return;
      }
      setUser(session.user);

      // Fetch delivery partner profile
      const { data: partnerData } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!partnerData) {
        setAuthChecked(true);
        return;
      }
      setPartner(partnerData);
      setAuthChecked(true);
    })();
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!partner) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select(`
        id, order_number, customer_name, mobile_number, address, pin_code,
        total, status, delivery_status, delivery_otp, payment_method,
        customer_lat, customer_lng, created_at
      `)
      .eq('delivery_partner_id', partner.id)
      .neq('status', 'Cancelled')
      .order('created_at', { ascending: false });

    setOrders(data || []);
    setLoading(false);
  }, [partner]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/delivery');
  };

  const handleVerifyOtp = async (orderId: string) => {
    const enteredOtp = otpInputs[orderId]?.trim() || '';
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.delivery_otp) return;

    if (enteredOtp === order.delivery_otp) {
      const { data } = await supabase
        .from('orders')
        .update({ status: 'Delivered', delivery_status: 'Delivered' })
        .eq('id', orderId)
        .select()
        .single();

      if (data) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Delivered', delivery_status: 'Delivered' } : o));
        setOtpSuccess(prev => ({ ...prev, [orderId]: true }));
        setOtpErrors(prev => { const n = { ...prev }; delete n[orderId]; return n; });
        setTimeout(() => {
          setOtpSuccess(prev => { const n = { ...prev }; delete n[orderId]; return n; });
        }, 3000);
      }
    } else {
      setOtpErrors(prev => ({ ...prev, [orderId]: 'Invalid OTP. Please check with customer.' }));
    }
  };

  const getDirectionsUrl = (order: DeliveryOrder) => {
    if (order.customer_lat && order.customer_lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${order.customer_lat},${order.customer_lng}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address + ' ' + order.pin_code)}`;
  };

  const openOrderDetail = async (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setSelectedItems([]);
    const { data } = await supabase
      .from('order_items')
      .select('id, quantity, price, product:products(name, image_url, pack_size)')
      .eq('order_id', order.id);
    if (data) setSelectedItems(data as unknown as DeliveryOrderItem[]);
  };

  // Show login form if not authenticated
  if (authChecked && !user) {
    return <DeliveryLogin />;
  }

  if (authChecked && user && !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs max-w-md w-full text-center">
          <Truck size={40} className="mx-auto text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Not Registered as Delivery Partner</h2>
          <p className="text-sm text-gray-500 mb-4">Your account is not linked to a delivery partner profile. Please contact the administrator.</p>
          <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200">
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber-600" />
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'Delivered');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={22} className="text-amber-600" />
            <div>
              <span className="text-lg font-black text-amber-600 tracking-tight">GINNIMAA</span>
              <span className="text-xs text-gray-400 ml-1.5">Delivery</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-700 hidden sm:block">{partner?.name}</span>
            <button onClick={handleLogout} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs text-center">
            <Package size={18} className="mx-auto text-gray-400 mb-1" />
            <p className="text-xl font-black text-gray-900">{orders.length}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Total</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs text-center">
            <Truck size={18} className="mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-black text-amber-600">{activeOrders.length}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Active</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs text-center">
            <CheckCircle size={18} className="mx-auto text-emerald-500 mb-1" />
            <p className="text-xl font-black text-emerald-600">{deliveredOrders.length}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Delivered</p>
          </div>
        </div>

        {/* Active Orders */}
        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Truck size={16} className="text-amber-600" /> Pending Deliveries ({activeOrders.length})
        </h2>

        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs text-center mb-6">
            <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-gray-600">No pending deliveries</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm">
                      <User size={13} className="text-gray-400" />
                      <span className="font-semibold text-gray-800">{order.customer_name}</span>
                    </div>
                    <a href={`tel:${order.mobile_number}`} className="flex items-center gap-1.5 mt-1 text-xs text-emerald-700 font-medium">
                      <Phone size={12} /> {order.mobile_number}
                    </a>
                    <div className="flex items-start gap-1.5 mt-1 text-xs text-gray-500">
                      <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                      <span>{order.address}, PIN: {order.pin_code}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-emerald-800 text-sm">{formatPrice(Number(order.total))}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{order.payment_method}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={getDirectionsUrl(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Navigation size={14} /> Get Directions
                  </a>
                  <button
                    onClick={() => openOrderDetail(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                  >
                    <Package size={14} /> View Items
                  </button>
                </div>

                {/* OTP verification */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound size={14} className="text-amber-600" />
                    <span className="text-xs font-semibold text-gray-600">Verify customer OTP to mark delivered</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={otpInputs[order.id] || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setOtpInputs(prev => ({ ...prev, [order.id]: val }));
                        setOtpErrors(prev => { const n = { ...prev }; delete n[order.id]; return n; });
                      }}
                      placeholder="4-digit OTP"
                      className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold tracking-widest text-center border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      onClick={() => handleVerifyOtp(order.id)}
                      disabled={(otpInputs[order.id] || '').length !== 4}
                      className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <ClipboardCheck size={14} /> Verify
                    </button>
                  </div>
                  {otpErrors[order.id] && (
                    <p className="text-xs text-rose-500 mt-1">{otpErrors[order.id]}</p>
                  )}
                  {otpSuccess[order.id] && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={12} /> Order marked as Delivered!
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivered Orders */}
        {deliveredOrders.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" /> Completed ({deliveredOrders.length})
            </h2>
            <div className="space-y-2">
              {deliveredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-gray-700">{order.order_number}</span>
                    <p className="text-xs text-gray-500">{order.customer_name} • {order.pin_code}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-emerald-700">{formatPrice(Number(order.total))}</span>
                    <p className="text-[10px] text-emerald-600 font-semibold">Delivered</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md max-h-[75vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-2 mb-4">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={item.product?.image_url || ''} alt={item.product?.name || ''} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity} • {formatPrice(Number(item.price))}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatPrice(Number(item.price) * item.quantity)}</span>
                  </div>
                ))}
                {selectedItems.length === 0 && <p className="text-sm text-gray-400">No items found</p>}
              </div>
              <a
                href={getDirectionsUrl(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
              >
                <Navigation size={16} /> Get Directions
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Delivery Partner Login Component
function DeliveryLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Enter email and password'); return; }
    setError('');
    setLoading(true);

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInErr || !data.session) {
      setError('Invalid credentials. Please check with admin.');
      setLoading(false);
      return;
    }

    // Check if delivery partner
    const { data: partner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', data.session.user.id)
      .maybeSingle();

    if (!partner) {
      await supabase.auth.signOut();
      setError('This account is not registered as a delivery partner.');
      setLoading(false);
      return;
    }

    // Will re-render with orders
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-700 mb-3">
            <Truck size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Delivery Partner Login</h1>
          <p className="text-xs text-gray-400 mt-1">Enter your email and password to access deliveries</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 text-rose-600 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="partner@ginnimaa.com"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 border border-gray-200"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 border border-gray-200"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
