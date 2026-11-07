import { useEffect, useState } from 'react';
import { Eye, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/types';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: status as Order['status'] });
    }
    fetchOrders();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">অর্ডার সমূহ</h2>
        <button onClick={fetchOrders} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">
          রিফ্রেশ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">অর্ডার লোড হচ্ছে...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">কোনো অর্ডার পাওয়া যায়নি।</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-3">অর্ডার আইডি</th>
                <th className="py-3 px-3">গ্রাহক</th>
                <th className="py-3 px-3">মোট টাকা</th>
                <th className="py-3 px-3">স্ট্যাটাস</th>
                <th className="py-3 px-3 text-right">বিস্তারিত</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                  <td className="py-3 px-3 font-medium text-gray-900">{o.customer_name || 'গ্রাহক'}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{formatPrice(o.total)}</td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => setSelectedOrder(o)} className="p-1 hover:text-emerald-600 inline-flex items-center gap-1 text-xs text-gray-600">
                      <Eye className="w-4 h-4" /> দেখুন
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-bold text-lg">অর্ডার বিবরণ (#{selectedOrder.id.slice(0, 8)})</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕ বন্ধ</button>
            </div>
            <div className="space-y-3 text-sm">
              <p><strong>গ্রাহকের নাম:</strong> {selectedOrder.customer_name}</p>
              <p><strong>মোবাইল:</strong> {selectedOrder.customer_phone}</p>
              <p><strong>ঠিকানা:</strong> {selectedOrder.customer_address}</p>
              <p><strong>মোট মূল্য:</strong> <span className="font-bold text-emerald-700">{formatPrice(selectedOrder.total)}</span></p>
              <div className="pt-2">
                <p className="font-bold mb-2">স্ট্যাটাস আপডেট করুন:</p>
                <div className="flex flex-wrap gap-2">
                  {(['New', 'Processing', 'Delivered', 'Cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(selectedOrder.id, st)}
                      className={`px-3 py-1 text-xs rounded-lg border font-medium ${
                        selectedOrder.status === st ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {st}
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
