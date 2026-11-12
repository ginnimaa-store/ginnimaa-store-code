import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Phone, Home, ShoppingBag, MessageCircle, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { fetchWhatsAppNumber } from '@/lib/settings';
import { buildOrderMessage, buildWhatsAppUrl, normalizeWhatsAppNumber } from '@/lib/whatsapp';

interface ConfirmOrder {
  id: string;
  order_number: string;
  customer_name: string;
  mobile_number: string;
  address: string;
  pin_code: string;
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  delivery_status: string;
  delivery_otp: string;
  created_at: string;
}

interface ConfirmItem {
  product_name: string;
  product_image: string | null;
  pack_size: string | null;
  quantity: number;
  price: number;
}

export function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const otp = searchParams.get('otp') || '';
  const [order, setOrder] = useState<ConfirmOrder | null>(null);
  const [items, setItems] = useState<ConfirmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    fetchWhatsAppNumber()
      .then(setWhatsappNumber)
      .catch(() => setWhatsappNumber(''));
  }, []);

  useEffect(() => {
    (async () => {
      if (!id || !otp) {
        setLoading(false);
        return;
      }
      const { data: orderData } = await supabase
        .rpc('lookup_order_by_otp', { p_order_id: id, p_otp: otp });

      if (orderData && orderData.length > 0) {
        const o = orderData[0];
        setOrder(o as unknown as ConfirmOrder);

        const { data: itemData } = await supabase
          .rpc('lookup_order_items_by_otp', { p_order_id: id, p_otp: otp });

        if (itemData && itemData.length > 0) {
          setItems((itemData as unknown as ConfirmItem[]).map(item => ({
            product_name: item.product_name || 'Product',
            product_image: item.product_image,
            pack_size: item.pack_size,
            quantity: item.quantity,
            price: Number(item.price),
          })));
        }
      }
      setLoading(false);
    })();
  }, [id, otp]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-medium">Order not found</p>
        <Link to="/" className="text-amber-600 font-semibold mt-2 inline-block hover:underline">Go home</Link>
      </div>
    );
  }

  const normalizedWhatsApp = normalizeWhatsAppNumber(whatsappNumber);
  const whatsappUrl = normalizedWhatsApp
    ? buildWhatsAppUrl(
        normalizedWhatsApp,
        buildOrderMessage(
          {
            order_number: order.order_number,
            customer_name: order.customer_name,
            mobile_number: order.mobile_number,
            address: order.address,
            pin_code: order.pin_code,
            total: Number(order.total),
            payment_method: order.payment_method || 'Cash on Delivery',
          },
          items.map(i => ({
            product_name: i.product_name,
            pack_size: i.pack_size,
            quantity: i.quantity,
            line_total: i.price * i.quantity,
          })),
        ),
      )
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Success banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-3 shadow-xs">
          <CheckCircle size={36} className="text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Order Placed Successfully!</h1>
        <p className="text-sm text-gray-500 mt-1">Thank you for shopping with GINNIMAA</p>
      </div>

      {/* Order ID + OTP */}
      <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100 mb-4 shadow-xs">
        <p className="text-xs text-gray-500 font-medium">Order ID</p>
        <p className="text-lg font-bold text-amber-700 tracking-wide">{order.order_number}</p>
        <div className="mt-2 pt-2 border-t border-amber-200/60">
          <p className="text-xs text-gray-600 font-medium flex items-center justify-center gap-1">
            <KeyRound size={13} className="text-amber-600" /> ডেলিভারি OTP (কুরিয়ারকে দেখাবেন)
          </p>
          <p className="text-2xl font-black text-amber-900 tracking-[0.3em] mt-1">{order.delivery_otp}</p>
        </div>
      </div>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 mb-4 rounded-xl font-semibold text-sm bg-[#25D366] text-white hover:bg-[#1ebe5a] shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} /> Send Order on WhatsApp
        </a>
      )}

      {/* Order status */}
      <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs mb-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
            <Package size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Order Status</p>
            <p className="font-bold text-amber-600">{order.status}</p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs mb-4">
        <h3 className="font-bold text-gray-900 mb-3">Products ({items.length} items)</h3>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                <img src={item.product_image || ''} alt={item.product_name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-400">{item.pack_size} • Qty: {item.quantity}</p>
              </div>
              <span className="font-bold text-sm text-gray-900">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-amber-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery charge</span>
            <span className="font-medium">
              {Number(order.delivery_charge) === 0 ? <span className="text-amber-700 font-bold">FREE</span> : formatPrice(Number(order.delivery_charge))}
            </span>
          </div>
          <div className="pt-2 border-t border-amber-100 flex justify-between">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="font-extrabold text-amber-800 text-lg">{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Customer details */}
      <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs mb-4">
        <h3 className="font-bold text-gray-900 mb-3">Delivery Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 mt-0.5">Name:</span>
            <span className="font-semibold text-gray-900">{order.customer_name}</span>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <span className="font-semibold text-gray-900">{order.mobile_number}</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{order.address}</p>
              <p className="text-gray-500 text-xs mt-0.5">PIN: {order.pin_code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Payment Method</p>
            <p className="font-bold text-gray-900">{order.payment_method || 'Cash on Delivery'}</p>
          </div>
          <p className="text-sm text-gray-600 font-medium">Pay {formatPrice(Number(order.total))} on delivery</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to="/"
          className="flex-1 py-3.5 rounded-xl font-bold text-xs md:text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <Home size={17} /> Home
        </Link>
        <Link
          to="/products"
          className="flex-1 py-3.5 rounded-xl font-bold text-xs md:text-sm bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <ShoppingBag size={17} /> Continue Shopping
        </Link>
      </div>
    </div>
  );
          }
        
