import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote, QrCode, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
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
  
  // GPS Location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI_QR'>('COD');
  const [paymentRefId, setPaymentRefId] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // GPS Coordinates Fetch
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('আপনার ডিভাইসে GPS সুবিধা সমর্থিত নয়।');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGettingLocation(false);
        setLocationSuccess(true);
      },
      () => {
        setGettingLocation(false);
        alert('সঠিক লোকেশন পাওয়া যায়নি। দয়া করে ডিভাইসের লোকেশন পারমিশন দিন।');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'অনুগ্রহ করে আপনার নাম লিখুন';
    if (!/^\d{10}$/.test(mobile)) e.mobile = 'সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন';
    if (!address.trim()) e.address = 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন';
    if (!/^\d{6}$/.test(pinCode)) e.pinCode = 'সঠিক ৬ সংখ্যার পিন কোড লিখুন';
    if (paymentMethod === 'UPI_QR' && !paymentRefId.trim()) {
      e.paymentRef = 'পেমেন্ট সম্পন্ন করার পর রেফারেন্স / UTR নম্বর লিখুন';
    }
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
      setErrors({ form: 'কাস্টমার তথ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' });
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
        payment_method: paymentMethod === 'COD' ? 'Cash on Delivery' : 'UPI QR Payment',
        status: 'New',
      })
      .select()
      .single();

    if (orderErr || !order) {
      setPlacing(false);
      setErrors({ form: 'অর্ডার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।' });
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
      setErrors({ form: 'অর্ডার আইটেম সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' });
      return;
    }

    setPlacing(false);
    clearCart();
    navigate(`/order-confirmation/${order.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 text-sm font-medium mb-4">
        <ArrowLeft size={18} /> কার্টে ফিরে যান
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-4">চেকআউট ও ডেলিভারি</h1>

      {/* Customer details form */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">ডেলিভারি ঠিকানা ও তথ্য</h3>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={gettingLocation}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              locationSuccess
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {gettingLocation ? (
              <>
                <Loader2 size={13} className="animate-spin" /> লোকেশন নেওয়া হচ্ছে...
              </>
            ) : locationSuccess ? (
              <>
                <CheckCircle2 size={13} /> GPS লোকেশন যুক্ত হয়েছে
              </>
            ) : (
              <>
                <MapPin size={13} /> লাইভ লোকেশন দিন
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">আপনার নাম</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="আপনার পুরো নাম লিখুন"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">মোবাইল নম্বর</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="১০ সংখ্যার মোবাইল নম্বর"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
            {errors.mobile && <p className="text-xs text-rose-500 mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">ডেলিভারির সম্পূর্ণ ঠিকানা</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="বাড়ি/ফ্ল্যাট নম্বর, রাস্তা, এলাকার নাম ও ল্যান্ডমার্ক"
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200 resize-none"
            />
            {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">পিন কোড (PIN Code)</label>
            <input
              type="tel"
              value={pinCode}
              onChange={e => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="৬ সংখ্যার পিন কোড"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
            {errors.pinCode && <p className="text-xs text-rose-500 mt-1">{errors.pinCode}</p>}
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <h3 className="font-bold text-gray-900 mb-3">পেমেন্ট পদ্ধতি নির্বাচন করুন</h3>
        
        <div className="space-y-3">
          {/* COD Option */}
          <div
            onClick={() => setPaymentMethod('COD')}
            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
              paymentMethod === 'COD'
                ? 'bg-emerald-50/60 border-emerald-600'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Banknote size={22} className={paymentMethod === 'COD' ? 'text-emerald-700' : 'text-gray-500'} />
            <div>
              <p className="font-semibold text-gray-900 text-sm">ক্যাশ অন ডেলিভারি (COD)</p>
              <p className="text-xs text-gray-500">অর্ডার হাতে পেয়ে নগদ টাকায় পেমেন্ট করুন</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === 'COD' ? 'border-emerald-600' : 'border-gray-300'
            }`}>
              {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}

        
