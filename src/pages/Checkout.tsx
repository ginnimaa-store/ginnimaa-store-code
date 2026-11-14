import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote, QrCode, MapPin, Loader2, CheckCircle2, Navigation, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { formatPrice, generateOrderNumber, generateOTP } from '@/lib/format';
import { useLang } from '@/context/LanguageContext';

export function Checkout() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCart();
  const { t } = useLang();
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
  const [pinDeliveryCharge, setPinDeliveryCharge] = useState<number | null>(null);
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
      alert(t('আপনার ডিভাইসে GPS সুবিধা সমর্থিত নয়।', 'GPS is not supported on your device.'));
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
        alert(t('সঠিক লোকেশন পাওয়া যায়নি। দয়া করে ডিভাইসের লোকেশন পারমিশন দিন।', 'Could not get location. Please grant location permission.'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleVerifyPin = async () => {
    if (!/^\d{6}$/.test(pinCode)) return;
    setVerifyingPin(true);
    const { data } = await supabase
      .from('serviceable_pincodes')
      .select('area_name, is_active, delivery_charge')
      .eq('pin_code', pinCode.trim())
      .maybeSingle();

    if (data && data.is_active) {
      setPinVerified(true);
      setPinAreaName(data.area_name);
      setPinDeliveryCharge(Number(data.delivery_charge) || 0);
    } else {
      setPinVerified(false);
      setPinAreaName('');
      setPinDeliveryCharge(null);
    }
    setVerifyingPin(false);
  };

  const subtotal = Number(getSubtotal()) || 0;
  const baseCharge = pinDeliveryCharge ?? 0;
  const deliveryCharge = subtotal >= 200 ? 0 : baseCharge;
  const grandTotal = subtotal + deliveryCharge;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('অনুগ্রহ করে আপনার নাম লিখুন', 'Please enter your name');
    if (!/^\d{10}$/.test(mobile)) e.mobile = t('সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন', 'Enter a valid 10-digit mobile number');
    if (!address.trim()) e.address = t('সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন', 'Enter your full delivery address');
    if (!/^\d{6}$/.test(pinCode)) e.pinCode = t('সঠিক ৬ সংখ্যার পিন কোড লিখুন', 'Enter a valid 6-digit PIN code');
    if (!pinVerified) e.pinCode = t('পিন কোড যাচাই করুন — এই এলাকায় ডেলিভারি উপলব্ধ কিনা দেখুন', 'Please verify PIN code to check delivery availability');
    if (paymentMethod === 'UPI_QR' && !paymentRefId.trim()) {
      e.paymentRef = t('পেমেন্ট সম্পন্ন করার পর রেফারেন্স / UTR নম্বর লিখুন', 'Enter the reference / UTR number after payment');
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
        throw new Error(customerErr?.message || t('কাস্টমার তথ্য সংরক্ষণ করা যায়নি।', 'Could not save customer information.'));
      }

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
          delivery_otp: otp,
          customer_lat: latitude,
          customer_lng: longitude,
        })
        .select()
        .single();

      if (orderErr || !order) {
        throw new Error(orderErr?.message || t('অর্ডার সম্পন্ন করা যায়নি।', 'Could not place the order.'));
      }

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
        throw new Error(itemsErr.message || t('অর্ডার আইটেম সংরক্ষণ করা যায়নি।', 'Could not save order items.'));
      }

      setPlacing(false);
      clearCart();
      navigate(`/order-confirmation/${order.id}?otp=${otp}`);
    } catch (err: any) {
      console.error('Order placement error:', err);
      setPlacing(false);
      setErrors({ form: err.message || t('অর্ডার প্লেস করার সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'An error occurred while placing the order. Please try again.') });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-600 text-sm font-medium mb-4">
        <ArrowLeft size={18} /> {t('কার্টে ফিরে যান', 'Back to Cart')}
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-4">{t('চেকআউট ও ডেলিভারি', 'Checkout & Delivery')}</h1>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">{t('ডেলিভারি ঠিকানা ও তথ্য', 'Delivery Address & Details')}</h3>
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
                <Loader2 size={13} className="animate-spin" /> {t('লোকেশন নেওয়া হচ্ছে...', 'Getting location...')}
              </>
            ) : locationSuccess ? (
              <>
                <CheckCircle2 size={13} /> {t('GPS লোকেশন যুক্ত হয়েছে', 'GPS location added')}
              </>
            ) : (
              <>
                <Navigation size={13} /> {t('লাইভ লোকেশন দিন', 'Share Live Location')}
              </>
            )}
          </button>
        </div>

        {locationSuccess && latitude !== null && longitude !== null && (
          <div className="mb-3 bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-700 flex items-center gap-1.5">
            <MapPin size={12} /> {t('ল্যাট', 'Lat')}: {latitude.toFixed(5)}, {t('লং', 'Lng')}: {longitude.toFixed(5)}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('আপনার নাম', 'Your Name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('আপনার পুরো নাম লিখুন', 'Enter your full name')}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('মোবাইল নম্বর', 'Mobile Number')}</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder={t('১০ সংখ্যার মোবাইল নম্বর', '10-digit mobile number')}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
            />
            {errors.mobile && <p className="text-xs text-rose-500 mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('ডেলিভারির সম্পূর্ণ ঠিকানা', 'Full Delivery Address')}</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder={t('বাড়ি/ফ্ল্যাট নম্বর, রাস্তা, এলাকার নাম ও ল্যান্ডমার্ক', 'House/Flat number, street, area name and landmark')}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200 resize-none"
            />
            {errors.address && <p className="text-xs text-rose-500 mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('পিন কোড (PIN Code)', 'PIN Code')}</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={pinCode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPinCode(val);
                  setPinVerified(null);
                  setPinAreaName('');
                  setPinDeliveryCharge(null);
                }}
                placeholder={t('৬ সংখ্যার পিন কোড', '6-digit PIN code')}
                className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
              <button
                type="button"
                onClick={handleVerifyPin}
                disabled={verifyingPin || pinCode.length !== 6}
                className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {verifyingPin ? t('যাচাই...', 'Checking...') : t('যাচাই করুন', 'Verify')}
              </button>
            </div>
            {errors.pinCode && <p className="text-xs text-rose-500 mt-1">{errors.pinCode}</p>}
            {pinVerified === true && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={13} /> {t(`ডেলিভারি উপলব্ধ — ${pinAreaName}`, `Delivery available — ${pinAreaName}`)} ({deliveryCharge === 0 ? t('ডেলিভারি ফ্রি', 'Free delivery') : t(`চার্জ: ${formatPrice(deliveryCharge)}`, `Charge: ${formatPrice(deliveryCharge)}`)})
              </div>
            )}
            {pinVerified === false && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                <AlertCircle size={13} /> {t('দুঃখিত, এই পিন কোডে ডেলিভারি উপলব্ধ নয়', 'Sorry, delivery is not available at this PIN code')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <h3 className="font-bold text-gray-900 mb-3">{t('পেমেন্ট পদ্ধতি নির্বাচন করুন', 'Select Payment Method')}</h3>

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
              <p className="font-semibold text-gray-900 text-sm">{t('ক্যাশ অন ডেলিভারি (COD)', 'Cash on Delivery (COD)')}</p>
              <p className="text-xs text-gray-500">{t('অর্ডার হাতে পেয়ে নগদ টাকায় পেমেন্ট করুন', 'Pay in cash when you receive your order')}</p>
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
              <p className="font-semibold text-gray-900 text-sm">{t('UPI QR পেমেন্ট', 'UPI QR Payment')}</p>
              <p className="text-xs text-gray-500">{t('QR স্ক্যান করে পেমেন্ট করুন ও রেফারেন্স নম্বর দিন', 'Scan QR to pay and enter reference number')}</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === 'UPI_QR' ? 'border-emerald-600' : 'border-gray-300'
            }`}>
              {paymentMethod === 'UPI_QR' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
            </div>
          </div>

          {paymentMethod === 'UPI_QR' && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">{t('Pay to UPI ID:', 'Pay to UPI ID:')} <b className="text-gray-900">ginnimaa@upi</b></p>
              <input
                type="text"
                value={paymentRefId}
                onChange={e => setPaymentRefId(e.target.value)}
                placeholder={t('UPI রেফারেন্স / UTR নম্বর লিখুন', 'Enter UPI reference / UTR number')}
                className="w-full px-3 py-2 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
              {errors.paymentRef && <p className="text-xs text-rose-500 mt-1">{errors.paymentRef}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <h3 className="font-bold text-gray-900 text-sm mb-3">{t('বিল ও পেমেন্টের বিবরণ', 'Bill & Payment Details')}</h3>
        <div className="space-y-2 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('পণ্যের মোট মূল্য', 'Subtotal')}</span>
            <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('ডেলিভারি চার্জ', 'Delivery Charge')}</span>
            <span className="font-semibold">
              {deliveryCharge === 0 ? (
                <span className="text-emerald-700 font-bold">{t('ফ্রি (FREE)', 'FREE')}</span>
              ) : (
                formatPrice(deliveryCharge)
              )}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
            <span className="font-bold text-gray-900 text-sm">{t('সর্বমোট প্রদেয়', 'Grand Total')}</span>
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
            <Loader2 size={18} className="animate-spin" /> {t('অর্ডার প্লেস করা হচ্ছে...', 'Placing order...')}
          </>
        ) : (
          t('অর্ডার কনফার্ম করুন', 'Confirm Order')
        )}
      </button>
    </div>
  );
}
