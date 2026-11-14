import { useEffect, useState, useCallback } from 'react';
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  X,
  MapPin,
  Phone,
  Navigation,
  User,
  KeyRound,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItemJson, DeliveryPartner } from '@/types';
import { formatPrice } from '@/lib/format';
import { exportOrdersExcel, exportOrdersPDF, type ExportOrderRow } from '@/lib/export';
import { FileSpreadsheet, FileText } from 'lucide-react';

const STATUSES = ['New', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

interface AdminOrder extends Omit<Order, 'order_items'> {
  order_items: {
    id: string;
    order_id: string;
    product_id: string | null;
    quantity: number;
    price: number;
    weight_option: string | null;
    cut_preference: string | null;
    product: {
      name: string;
      image_url: string | null;
      pack_size: string | null;
    } | null;
  }[];
}

interface DisplayItem {
  product_name: string;
  product_image: string | null;
  pack_size: string | null;
  quantity: number;
  line_total: number;
  weight_option: string | null;
  cut_preference: string | null;
}

function getDisplayItems(order: AdminOrder): DisplayItem[] {
  if (order.order_items && order.order_items.length > 0) {
    return order.order_items.map(oi => ({
      product_name: oi.product?.name || 'পণ্য',
      product_image: oi.product?.image_url || null,
      pack_size: oi.product?.pack_size || oi.weight_option || null,
      quantity: oi.quantity,
      line_total: oi.price * oi.quantity,
      weight_option: oi.weight_option,
      cut_preference: oi.cut_preference,
    }));
  }
  if (order.items_json) {
    return (order.items_json as unknown as OrderItemJson[]).map(item => ({
      product_name: item.product_name,
      product_image: item.product_image,
      pack_size: item.pack_size,
      quantity: item.quantity,
      line_total: item.line_total,
      weight_option: null,
      cut_preference: null,
    }));
  }
  return [];
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, revenue: 0 });
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_items:order_items(*, product:products(*))
      `)
      .order('created_at', { ascending: false });
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    const { data } = await query;
    setOrders((data || []) as unknown as AdminOrder[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('total, status');
      const all = data || [];
      setStats({
        total: all.length,
        pending: all.filter(o => o.status === 'New' || o.status === 'Confirmed' || o.status === 'Packed' || o.status === 'Out for Delivery').length,
        delivered: all.filter(o => o.status === 'Delivered').length,
        revenue: all.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + Number(o.total), 0),
      });
    })();
  }, [orders]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('delivery_partners').select('*').order('name');
      setDeliveryPartners(data || []);
    })();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    const { data } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    if (data) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    }
  };

  const updatePaymentStatus = async (orderId: string, payment_status: string) => {
    const { data } = await supabase
      .from('orders')
      .update({ payment_status })
      .eq('id', orderId)
      .select()
      .single();
    if (data) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status });
      }
    }
  };

  const assignPartner = async (orderId: string, partnerId: string) => {
    const { data } = await supabase
      .from('orders')
      .update({ delivery_partner_id: partnerId || null })
      .eq('id', orderId)
      .select()
      .single();
    if (data) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_partner_id: partnerId || null } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, delivery_partner_id: partnerId || null });
      }
    }
  };

  const statusColors: Record<string, string> = {
    'New': 'bg-amber-100 text-amber-800 border-amber-200',
    'Confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
    'Packed': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Out for Delivery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Delivered': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Cancelled': 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const partnerName = (id: string | null | undefined) => {
    if (!id) return null;
    const p = deliveryPartners.find(dp => dp.id === id);
    return p?.name || null;
  };

  const buildExportRows = (): ExportOrderRow[] => {
    return orders.map(o => ({
      orderId: o.order_number,
      date: new Date(o.created_at).toLocaleString('en-IN'),
      customerName: o.customer_name,
      phone: o.mobile_number,
      address: `${o.address}, PIN: ${o.pin_code}`,
      items: getDisplayItems(o).map(i => `${i.product_name} x${i.quantity}`).join('; '),
      total: Number(o.total),
      status: o.status,
      otp: o.delivery_otp || '',
      partner: partnerName(o.delivery_partner_id) || '',
    }));
  };

  const handleExportExcel = () => {
    const rows = buildExportRows();
    if (rows.length === 0) return;
    exportOrdersExcel(rows);
  };

  const handleExportPDF = () => {
    const rows = buildExportRows();
    if (rows.length === 0) return;
    exportOrdersPDF(rows);
  };

  const getDirectionsUrl = (order: AdminOrder) => {
    if (order.customer_lat && order.customer_lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${order.customer_lat},${order.customer_lng}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address + ' ' + order.pin_code)}`;
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Package size={17} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-semibold">মোট অর্ডার</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={17} className="text-amber-500" />
            <span className="text-xs text-gray-500 font-semibold">প্রক্রিয়াধীন</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={17} className="text-emerald-500" />
            <span className="text-xs text-gray-500 font-semibold">ডেলিভার্ড</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={17} className="text-blue-500" />
            <span className="text-xs text-gray-500 font-semibold">মোট আয়</span>
          </div>
          <p className="text-2xl font-black text-blue-700">{formatPrice(stats.revenue)}</p>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          disabled={orders.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet size={14} /> Export Excel
        </button>
        <button
          onClick={handleExportPDF}
          disabled={orders.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
        >
          <FileText size={14} /> Export PDF
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === s
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'সব অর্ডার' : s}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100">
          <Package size={40} className="mx-auto text-gray-300" />
          <p className="font-semibold text-sm mt-2">কোনো অর্ডার পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-emerald-100 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    {order.payment_status && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.payment_status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.payment_status === 'VERIFIED' ? 'পেমেন্ট যাচাইকৃত' : 'পেমেন্ট বাকি'}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {order.customer_name} <span className="text-xs font-normal text-gray-500">• {order.mobile_number}</span>
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                    <span>{getDisplayItems(order).length}টি আইটেম</span>
                    <span>• PIN: <b>{order.pin_code}</b></span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-medium text-gray-700">
                      {order.payment_method || 'COD'}
                    </span>
                    {order.payment_ref_id && (
                      <span className="text-emerald-800 font-mono text-[11px]">
                        Ref: {order.payment_ref_id}
                      </span>
                    )}
                    {partnerName(order.delivery_partner_id) && (
                      <span className="text-indigo-700 text-[11px] font-medium">
                        কুরিয়ার: {partnerName(order.delivery_partner_id)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-extrabold text-emerald-800 text-base">{formatPrice(Number(order.total))}</p>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 ml-auto transition-colors"
                  >
                    <Eye size={13} /> বিস্তারিত
                  </button>
                </div>
              </div>

              {/* Status Update Quick Buttons */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-none">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(order.id, s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      order.status === s
                        ? statusColors[s] + ' font-bold ring-1 ring-offset-1'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setSelectedOrder(null)}>
          <div
            className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-gray-900">{selectedOrder.order_number}</h3>
                <p className="text-xs text-gray-400">{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">আইটেম</h4>
                <div className="space-y-2">
                  {getDisplayItems(selectedOrder).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img src={item.product_image || ''} alt={item.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400">
                          {item.pack_size} • Qty: {item.quantity}
                          {item.cut_preference ? ` • ${item.cut_preference}` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(item.line_total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill summary */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">সাবটোটাল</span><span className="font-medium">{formatPrice(Number(selectedOrder.subtotal))}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">ডেলিভারি চার্জ</span><span className="font-medium">{formatPrice(Number(selectedOrder.delivery_charge))}</span></div>
                <div className="flex justify-between pt-1.5 border-t border-gray-200"><span className="font-bold text-gray-900">মোট</span><span className="font-bold text-emerald-700">{formatPrice(Number(selectedOrder.total))}</span></div>
              </div>

              {/* Customer details */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">কাস্টমার</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /><span className="font-medium text-gray-900">{selectedOrder.customer_name}</span></div>
                  <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><a href={`tel:${selectedOrder.mobile_number}`} className="font-medium text-emerald-700">{selectedOrder.mobile_number}</a></div>
                  <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5" /><div><p className="font-medium text-gray-900">{selectedOrder.address}</p><p className="text-xs text-gray-500">PIN: {selectedOrder.pin_code}</p></div></div>
                  <a
                    href={getDirectionsUrl(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Navigation size={13} /> Get Directions
                  </a>
                </div>
              </div>

              {/* Delivery OTP */}
              {selectedOrder.delivery_otp && (
                <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-2">
                  <KeyRound size={16} className="text-indigo-600" />
                  <span className="text-xs text-gray-600">ডেলিভারি OTP:</span>
                  <span className="text-lg font-black text-indigo-700 tracking-[0.2em]">{selectedOrder.delivery_otp}</span>
                </div>
              )}

              {/* Payment status */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">পেমেন্ট</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-700">{selectedOrder.payment_method || 'COD'}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedOrder.payment_status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedOrder.payment_status || 'PENDING'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePaymentStatus(selectedOrder.id, 'VERIFIED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    যাচাই করুন
                  </button>
                  <button
                    onClick={() => updatePaymentStatus(selectedOrder.id, 'PENDING')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                  >
                    বাকি করুন
                  </button>
                </div>
              </div>

              {/* Delivery partner assignment */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">ডেলিভারি পার্টনার</h4>
                <select
                  value={selectedOrder.delivery_partner_id || ''}
                  onChange={e => assignPartner(selectedOrder.id, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">কুরিয়ার নির্বাচন করুন</option>
                  {deliveryPartners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.phone ? `• ${p.phone}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
