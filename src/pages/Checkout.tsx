import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { formatPrice, generateOrderNumber } from '@/lib/format';

export function Checkout() {
  const navigate = useNavigate();
  const { items, getSubtotal, getDeliveryCharge, getTotal, clearCart } = useCart();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Please enter your name';
    if (!/^\d{10}$/.test(mobile)) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!address.trim()) e.address = 'Please enter your delivery address';
    if (!/^\d{6}$/.test(pinCode)) e.pinCode = 'Enter a valid 6-digit PIN code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);

    const orderNumber = generateOrderNumber();

    // 1. Insert customer
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .insert({
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        pin_code: pinCode.trim(),
      })
      .select()
      .single();

    if (customerErr || !customer) {
      setPlacing(false);
      setErrors({ form: 'Failed to save customer details. Please try again.' });
      return;
    }

    // 2. Insert order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        customer_name: customer.name,
        mobile_number: customer.mobile,
        address: customer.address,
        pin_code: customer.pin_code,
        subtotal: getSubtotal(),
        delivery_charge: getDeliveryCharge(),
        total: getTotal(),
        payment_method: 'Cash on Delivery',
        status: 'New',
      })
      .select()
      .single();

    if (orderErr || !order) {
      setPlacing(false);
      setErrors({ form: 'Failed to place order. Please try again.' });
      return;
    }

    // 3. Insert order items
    const orderItemsData = items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.selling_price,
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsErr) {
      setPlacing(false);
      setErrors({ form: 'Failed to save order items. Please try again.' });
      return;
    }

    setPlacing(false);
    clearCart();
    navigate(`/order-confirmation/${order.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 text-sm font-medium mb-4">
        <ArrowLeft size={18} /> Back to Cart
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-4">Checkout</h1>

      {/* Customer details form */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Delivery Details</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
            />
            {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Delivery Address</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="House no, street, area, city, state"
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100 resize-none"
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">PIN Code</label>
            <input
              type="tel"
              value={pinCode}
              onChange={e => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit PIN code"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 border border-gray-100"
            />
            {errors.pinCode && <p className="text-xs text-red-500 mt-1">{errors.pinCode}</p>}
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Payment Method</h3>
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border-2 border-green-600">
          <Banknote size={22} className="text-green-700" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Cash on Delivery</p>
            <p className="text-xs text-gray-500">Pay when your order arrives</p>
          </div>
          <div className="ml-auto w-5 h-5 rounded-full border-2 border-green-600 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
          </div>
        </div>
      </div>

      {/* Order summary */}
      <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {items.map(item => (
            <div key={item.product.id} className="flex items-center gap-2 text-sm">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img src={item.product.image_url || ''} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-gray-400">{item.quantity} x {formatPrice(item.product.selling_price)}</p>
              </div>
              <span className="font-medium text-gray-900">{formatPrice(item.product.selling_price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(getSubtotal())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery charge</span>
            <span className="font-medium">
              {getDeliveryCharge() === 0 ? <span className="text-green-600">FREE</span> : formatPrice(getDeliveryCharge())}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-green-700 text-lg">{formatPrice(getTotal())}</span>
          </div>
        </div>
      </div>

      {errors.form && (
        <p className="text-sm text-red-500 mt-3 text-center">{errors.form}</p>
      )}

      <button
        onClick={handlePlaceOrder}
        disabled={placing}
        className="mt-4 w-full py-3.5 rounded-xl font-semibold text-sm bg-green-700 text-white hover:bg-green-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {placing ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Placing Order...
          </>
        ) : (
          `Place Order • ${formatPrice(getTotal())}`
        )}
      </button>
    </div>
  );
}
