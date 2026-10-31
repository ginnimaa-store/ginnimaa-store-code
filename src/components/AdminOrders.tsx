import { useEffect, useState, useCallback } from 'react';
import { Package, TrendingUp, Clock, CheckCircle, Eye, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItemJson } from '@/types';
import { formatPrice } from '@/lib/format';

const STATUSES = ['New', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

interface AdminOrder extends Omit<Order, 'order_items'> {
  order_items: {
    id: string;
    order_id: string;
    product_id: string | null;
    quantity: number;
    price: number;
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
}

function getDisplayItems(order: AdminOrder): DisplayItem[] {
  if (order.order_items && order.order_items.length > 0) {
    return order.order_items.map(oi => ({
      product_name: oi.product?.name || 'Product',
      product_image: oi.product?.image_url || null,
      pack_size: oi.product?.pack_size || null,
      quantity: oi.quantity,
      line_total: oi.price * oi.quantity,
    }));
  }
  if (order.items_json) {
    return (order.items_json as unknown as OrderItemJson[]).map(item => ({
      product_name: item.product_name,
      product_image: item.product_image,
      pack_size: item.pack_size,
      quantity: item.quantity,
      line_total: item.line_total,
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

  const statusColors: Record<string, string> = {
    'New': 'bg-amber-100 text-amber-700',
    'Confirmed': 'bg-blue-100 text-blue-700',
    'Packed': 'bg-cyan-100 text-cyan-700',
    'Out for Delivery': 'bg-indigo-100 text-indigo-700',
    'Delivered': 'bg-green-100 text-green-700',
    'Cancelled': 'bg-red-100 text-red-700',
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={18} className="text-amber-400" />
            <span className="text-xs text-gray-500 font-medium">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={18} className="text-green-500" />
            <span className="text-xs text-gray-500 font-medium">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-blue-400" />
            <span className="text-xs text-gray-500 font-medium">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatPrice(stats.revenue)}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors capitalize ${
              filter === s
                ? 'bg-green-700 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {s === 'all' ? 'All Orders' : s}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package size={40} className="mx-auto text-gray-300" />
          <p className="font-medium mt-2">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{order.customer_name} • {order.mobile_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{getDisplayItems(order).length} items • PIN: {order.pin_code}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-700">{formatPrice(Number(order.total))}</p>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="mt-1.5 text-xs font-semibold text-green-700 flex items-center gap-1 ml-auto"
                  >
                    <Eye size={14} /> View
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1.5 overflow-x-auto">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(order.id, s)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      order.status === s
                        ? statusColors[s] + ' ring-1 ring-offset-1'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
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
            className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400">
                <X size={22} />
              </button>
            </div>
            <div className="p-5">
              <div className="text-center mb-4">
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="text-lg font-bold text-green-700">{selectedOrder.order_number}</p>
                <span className={`inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Customer</p>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.mobile_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Delivery Address</p>
                  <p className="text-sm text-gray-700">{selectedOrder.address}</p>
                  <p className="text-sm text-gray-600">PIN: {selectedOrder.pin_code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Payment</p>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.payment_method || 'Cash on Delivery'}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="font-semibold text-sm text-gray-900 mb-2">Items</p>
                <div className="space-y-2">
                  {getDisplayItems(selectedOrder).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img src={item.product_image || ''} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400">{item.pack_size} • Qty {item.quantity}</p>
                      </div>
                      <span className="font-medium text-gray-900">{formatPrice(item.line_total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(Number(selectedOrder.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery charge</span>
                  <span className="font-medium">
                    {Number(selectedOrder.delivery_charge) === 0 ? <span className="text-green-600">FREE</span> : formatPrice(Number(selectedOrder.delivery_charge))}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-green-700">{formatPrice(Number(selectedOrder.total))}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-2">Update Status</p>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedOrder.status === s
                          ? statusColors[s] + ' ring-1 ring-offset-1'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
