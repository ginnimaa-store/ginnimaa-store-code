// checkout.tsx ফাইল
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote, QrCode, MapPin, Loader2, CheckCircle2, Navigation, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { formatPrice, generateOrderNumber, generateOTP } from '@/lib/format';

export function Checkout() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCart();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const [pinVerified, setPinVerified] = useState<boolean | null>(null);
  const [pinAreaName, setPinAreaName] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI_QR'>('COD');
  const [paymentRefId, setPaymentRefId] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('আপনার ডিভাইসে GPS সুবিধা সমর্থিত নয়।');
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
        alert('সঠিক লোকেশন পাওয়া যায়নি। দয়া করে ডিভাইসের লোকেশন পারমিশন দিন।');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleVerifyPin = async () => {
    if (!/^\d{6}$/.test(pinCode)) return;
    setVerifyingPin(true);
    const { data } = await supabase
      .from('serviceable_pincodes')
      .select('area_name, is_active')
      .eq('pin_code', pinCode.trim())
      .maybeSingle();

    if (data && data.is_active) {
      setPinVerified(true);
      setPinAreaName(data.area_name);
    } else {
      setPinVerified(false);
      setPinAreaName('');
    }
    setVerifyingPin(false);
  };

  // ২০০ টাকা বা তার বেশি হলে ডেলিভারি ফ্রি (০ টাকা), ২০০ টাকার নিচে হলে ৩৫ টাকা
  const subtotal = Number(getSubtotal()) || 0;
  const deliveryCharge = subtotal >= 200 ? 0 : 35;
  const grandTotal = subtotal + deliveryCharge;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'অনুগ্রহ করে আপনার নাম লিখুন';
    if (!/^\d{10}$/.test(mobile)) e.mobile = 'সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন';
    if (!address.trim()) e.address = 'সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন';
    if (!/^\d{6}$/.test(pinCode)) e.pinCode = 'সঠিক ৬ সংখ্যার পিন কোড লিখুন';
    if (!pinVerified) e.pinCode = 'পিন কোড যাচাই করুন — এই এলাকায় ডেলিভারি উপলব্ধ কিনা দেখুন';
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
    const otp = generateOTP();

    try {
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
        throw new Error(customerErr?.message || 'কাস্টমার তথ্য সংরক্ষণ করা যায়নি।');
      }

      // 2. Insert order (নিরাপদ ও নিশ্চিত কলামসমূহ)
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          customer_name: customer.name,
          mobile_number: customer.mobile,
          address: customer.address,
          pin_code: customer.pin_code,
          subtotal: subtotal,
          delivery_charge: deliveryCharge,
          total: grandTotal,
          payment_method: paymentMethod === 'COD' ? 'Cash on Delivery' : 'UPI QR Payment',
          payment_status: 'PENDING',
          payment_ref_id: paymentMethod === 'UPI_QR' ? paymentRefId.trim() : null,
          status: 'New',
        })
        .select()
        .single();

      if (orderErr || !order) {
        throw new Error(orderErr?.message || 'অর্ডার সম্পন্ন করা যায়নি।');
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
        throw new Error(itemsErr.message || 'অর্ডার আইটেম সংরক্ষণ করা যায়নি।');
      }

      setPlacing(false);
      clearCart();
      navigate(`/order-confirmation/${order.id}?otp=${otp}`);
    } catch (err: any) {
      console.error('Order placement error:', err);
      setPlacing(false);
      setErrors({ form: err.message || 'অর্ডার প্লেস করার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 text-sm font-medium mb-4">
        <ArrowLeft size={18} /> কার্টে ফিরে যান
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-4">চেকআউট ও ডেলিভারি</h1>

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
                <Loader2 size={13} className="animate-spin" /> লোকেশন নেওয়া হচ্ছে...
              </>
            ) : locationSuccess ? (
              <>
                <CheckCircle2 size={13} /> GPS লোকেশন যুক্ত হয়েছে
              </>
            ) : (
              <>
                <Navigation size={13} /> লাইভ লোকেশন দিন
              </>
            )}
          </button>
        </div>

        {locationSuccess && latitude !== null && longitude !== null && (
          <div className="mb-3 bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-700 flex items-center gap-1.5">
            <MapPin size={12} /> ল্যাট: {latitude.toFixed(5)}, লং: {longitude.toFixed(5)}
          </div>
        )}

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
              placeholder="বাড়ি/ফ্ল্যাট নম্বর, রাস্তা, এলাকার নাম ও ল্যান্ডমার্ক"
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200 resize-none"
            />
            {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">পিন কোড (PIN Code)</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={pinCode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPinCode(val);
                  setPinVerified(null);
                  setPinAreaName('');
                }}
                placeholder="৬ সংখ্যার পিন কোড"
                className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
              <button
                type="button"
                onClick={handleVerifyPin}
                disabled={verifyingPin || pinCode.length !== 6}
                className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {verifyingPin ? 'যাচাই...' : 'যাচাই করুন'}
              </button>
            </div>
            {errors.pinCode && <p className="text-xs text-rose-500 mt-1">{errors.pinCode}</p>}
            {pinVerified === true && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={13} /> ডেলিভারি উপলব্ধ — {pinAreaName} ({deliveryCharge === 0 ? 'ডেলিভারি ফ্রি' : `চার্জ: ${formatPrice(deliveryCharge)}`})
              </div>
            )}
            {pinVerified === false && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                <AlertCircle size={13} /> দুঃখিত, এই পিন কোডে ডেলিভারি উপলব্ধ নয়
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <h3 className="font-bold text-gray-900 mb-3">পেমেন্ট পদ্ধতি নির্বাচন করুন</h3>

        <div className="space-y-3">
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
              <p className="text-xs text-gray-500">অর্ডার হাতে পেয়ে নগদ টাকায় পেমেন্ট করুন</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === 'COD' ? 'border-emerald-600' : 'border-gray-300'
            }`}>
              {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
            </div>
          </div>

          <div
            onClick={() => setPaymentMethod('UPI_QR')}
            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
              paymentMethod === 'UPI_QR'
                ? 'bg-emerald-50/60 border-emerald-600'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <QrCode size={22} className={paymentMethod === 'UPI_QR' ? 'text-emerald-700' : 'text-gray-500'} />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">UPI QR পেমেন্ট</p>
              <p className="text-xs text-gray-500">QR স্ক্যান করে পেমেন্ট করুন ও রেফারেন্স নম্বর দিন</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === 'UPI_QR' ? 'border-emerald-600' : 'border-gray-300'
            }`}>
              {paymentMethod === 'UPI_QR' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
            </div>
          </div>

          {paymentMethod === 'UPI_QR' && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Pay to UPI ID: <b className="text-gray-900">ginnimaa@upi</b></p>
              <input
                type="text"
                value={paymentRefId}
                onChange={e => setPaymentRefId(e.target.value)}
                placeholder="UPI রেফারেন্স / UTR নম্বর লিখুন"
                className="w-full px-3 py-2 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
              {errors.paymentRef && <p className="text-xs text-rose-500 mt-1">{errors.paymentRef}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <h3 className="font-bold text-gray-900 text-sm mb-3">বিল ও পেমেন্টের বিবরণ</h3>
        <div className="space-y-2 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">পণ্যের মোট মূল্য</span>
            <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ডেলিভারি চার্জ</span>
            <span className="font-semibold">
              {deliveryCharge === 0 ? (
                <span className="text-emerald-700 font-bold">ফ্রি (FREE)</span>
              ) : (
                formatPrice(deliveryCharge)
              )}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
            <span className="font-bold text-gray-900 text-sm">সর্বমোট প্রদেয়</span>
            <span className="font-extrabold text-emerald-800 text-lg">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      {errors.form && (
        <div className="mt-3 bg-rose-50 text-rose-600 text-sm font-medium px-4 py-2.5 rounded-xl border border-rose-100">
          {errors.form}
        </div>
      )}

      <button
        onClick={handlePlaceOrder}
        disabled={placing}
        className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
      >
        {placing ? (
          <>
            <Loader2 size={18} className="animate-spin" /> অর্ডার প্লেস করা হচ্ছে...
          </>
        ) : (
          'অর্ডার কনফার্ম করুন'
        )}
      </button>
    </div>
  );
          }
    
