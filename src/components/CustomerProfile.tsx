import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Phone, Mail, LogOut, Loader2, Navigation, CheckCircle2, MapPin, Edit3, Save, X, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useLang } from '@/context/LanguageContext';

export function CustomerProfile() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPinCode, setEditPinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  // GPS state
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);

  // Customer record from DB
  const [customer, setCustomer] = useState<any>(null);

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
      const mobile = currentUser.user_metadata?.mobile || '';

      // Fetch customer record
      const { data: custData } = await supabase
        .from('customers')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle();

      if (custData) {
        setCustomer(custData);
        setEditName(custData.name || '');
        setEditMobile(custData.mobile || '');
        setEditAddress(custData.address || '');
        setEditPinCode(custData.pin_code || '');
        setLat(custData.latitude ? Number(custData.latitude) : null);
        setLng(custData.longitude ? Number(custData.longitude) : null);
      }

      const { data: customerOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('mobile_number', mobile)
        .order('created_at', { ascending: false });

      if (customerOrders) {
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t('আপনার ডিভাইসে GPS সুবিধা সমর্থিত নয়।', 'GPS not supported on your device.'));
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        setGettingLocation(false);

        // Save to customers table
        if (customer) {
          await supabase
            .from('customers')
            .update({ latitude: newLat, longitude: newLng })
            .eq('id', customer.id);
        }
        setLocationSaved(true);
        setTimeout(() => setLocationSaved(false), 3000);
      },
      () => {
        setGettingLocation(false);
        alert(t('লোকেশন পাওয়া যায়নি। পারমিশন দিন।', 'Could not get location. Please grant permission.'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveEdit = async () => {
    if (!customer) return;
    setSaving(true);
    setEditMsg('');

    const { error } = await supabase
      .from('customers')
      .update({
        name: editName.trim(),
        mobile: editMobile.trim(),
        address: editAddress.trim(),
        pin_code: editPinCode.trim(),
      })
      .eq('id', customer.id);

    if (error) {
      setEditMsg(t('সংরক্ষণ করা যায়নি।', 'Could not save.'));
    } else {
      setCustomer({ ...customer, name: editName.trim(), mobile: editMobile.trim(), address: editAddress.trim(), pin_code: editPinCode.trim() });
      setEditMsg(t('সফলভাবে সংরক্ষিত হয়েছে!', 'Saved successfully!'));
      setEditing(false);
      setTimeout(() => setEditMsg(''), 3000);
    }
    setSaving(false);
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
      {/* Profile header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 font-bold text-2xl">
            {user?.user_metadata?.full_name?.charAt(0) || 'C'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{customer?.name || user?.user_metadata?.full_name || t('কাস্টমার', 'Customer')}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 justify-center md:justify-start">
              <Mail size={13} /> {user?.email}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 justify-center md:justify-start">
              <Phone size={13} /> {customer?.mobile || t('নম্বর যুক্ত নেই', 'No phone')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs rounded-xl transition-colors border border-amber-200"
            >
              <Edit3 size={15} /> {t('প্রোফাইল এডিট', 'Edit Profile')}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs rounded-xl transition-colors"
          >
            <LogOut size={16} /> {t('লগ আউট', 'Logout')}
          </button>
        </div>
      </div>

      {editMsg && (
        <div className="mb-4 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2.5 rounded-xl border border-emerald-100">
          {editMsg}
        </div>
      )}

      {/* Edit form or profile details */}
      {editing ? (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">{t('তথ্য সম্পাদনা', 'Edit Information')}</h2>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('নাম', 'Name')}</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('মোবাইল নম্বর', 'Phone Number')}</label>
              <input
                type="tel"
                value={editMobile}
                onChange={e => setEditMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('ডেলিভারি ঠিকানা', 'Delivery Address')}</label>
              <textarea
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('পিন কোড', 'PIN Code')}</label>
              <input
                type="tel"
                value={editPinCode}
                onChange={e => setEditPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
            </div>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> {t('সংরক্ষণ করুন', 'Save')}</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={18} className="text-emerald-700" /> {t('ডেলিভারি তথ্য', 'Delivery Details')}
            </h2>
            <button
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                locationSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {gettingLocation ? (
                <><Loader2 size={13} className="animate-spin" /> {t('নেওয়া হচ্ছে...', 'Getting...')}</>
              ) : locationSaved ? (
                <><CheckCircle2 size={13} /> {t('লোকেশন সংরক্ষিত', 'Location Saved')}</>
              ) : (
                <><Navigation size={13} /> {t('লাইভ লোকেশন দিন', 'Capture Location')}</>
              )}
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 shrink-0">{t('ঠিকানা', 'Address')}</span>
              <span className="font-medium text-gray-900">{customer?.address || t('যুক্ত নেই', 'Not set')}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-20 shrink-0">{t('পিন কোড', 'PIN Code')}</span>
              <span className="font-medium text-gray-900">{customer?.pin_code || t('যুক্ত নেই', 'Not set')}</span>
            </div>
            {lat && lng && (
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-20 shrink-0">GPS</span>
                <span className="font-mono text-xs text-emerald-700">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order history */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Package size={20} className="text-emerald-700" /> {t('অর্ডার হিস্ট্রি', 'Order History')} ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">{t('আপনি এখনো কোনো অর্ডার করেননি', 'You have no orders yet')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-emerald-800">{order.order_number}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="font-extrabold text-sm text-gray-900">{formatPrice(Number(order.total))}</span>
                </div>
                <p className="text-xs text-gray-500">{t('ঠিকানা', 'Address')}: {order.address}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                {order.delivery_otp && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <KeyRound size={12} className="text-amber-600" />
                    <span className="text-gray-500">{t('ডেলিভারি OTP', 'Delivery OTP')}:</span>
                    <span className="font-black text-amber-700 tracking-widest">{order.delivery_otp}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
