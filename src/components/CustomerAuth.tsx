import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, User, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function CustomerAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'SIGNUP' | 'VERIFY_OTP' | 'SIGNIN'>('SIGNUP');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile || !password) {
      setError('সবগুলো ঘর পূরণ করুন');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError('সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            mobile: mobile.trim(),
          },
        },
      });

      if (signUpErr) throw signUpErr;

      if (data.user) {
        await supabase.from('customers').upsert({
          id: data.user.id,
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
        }, { onConflict: 'mobile' });
      }

      setLoading(false);
      setSuccessMsg('আপনার ইমেলে একটি ওটিপি পাঠানো হয়েছে। কোডটি নিচে লিখুন।');
      setMode('VERIFY_OTP');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'সাইন আপ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('ওটিপি কোডটি লিখুন');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'signup',
      });

      if (verifyErr) throw verifyErr;

      if (data.session) {
        localStorage.setItem('ginnimaa_session', JSON.stringify(data.session));
        setLoading(false);
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError('ভুল ওটিপি কোড দিয়েছেন। দয়া করে সঠিক কোড দিন।');
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('ইমেল এবং পাসওয়ার্ড দিন');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInErr) throw signInErr;

      if (data.session) {
        localStorage.setItem('ginnimaa_session', JSON.stringify(data.session));
        setLoading(false);
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError('ইমেল বা পাসওয়ার্ড সঠিক নয়।');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 mb-3">
            <User size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {mode === 'SIGNUP' && 'কাস্টমার সাইন আপ'}
            {mode === 'VERIFY_OTP' && 'ইমেল ওটিপি ভেরিফিকেশন'}
            {mode === 'SIGNIN' && 'কাস্টমার লগইন'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'SIGNUP' && 'আপনার বিবরণ দিয়ে নতুন অ্যাকাউন্ট তৈরি করুন'}
            {mode === 'VERIFY_OTP' && 'আপনার ইমেলে পাঠানো ওটিপি কোডটি লিখুন'}
            {mode === 'SIGNIN' && 'আপনার ইমেল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 text-rose-600 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-rose-100">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-emerald-100">
            {successMsg}
          </div>
        )}

        {mode === 'SIGNUP' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">আপনার নাম</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="সম্পূর্ণ নাম লিখুন"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">ইমেল আইডি</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Mail size={16} /></span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">মোবাইল নম্বর</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Phone size={16} /></span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="১০ সংখ্যার মোবাইল নম্বর"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">পাসওয়ার্ড</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Lock size={16} /></span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-emerald-700 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'সাইন আপ ও ওটিপি পাঠান'}
            </button>

            <p className="text-center text-xs text-gray-500 mt-3">
              আগে থেকেই অ্যাকাউন্ট আছে?{' '}
              <button type="button" onClick={() => setMode('SIGNIN')} className="text-emerald-700 font-bold hover:underline">
                লগইন করুন
              </button>
            </p>
          </form>
        )}

        {mode === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">ইমেলে পাওয়া ওটিপি কোড</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="যেমন: 123456"
                className="w-full px-4 py-3 text-center tracking-widest font-bold text-lg bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-700 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'ওটিপি যাচাই করুন'}
            </button>
          </form>
        )}

        {mode === 'SIGNIN' && (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">ইমেল আইডি</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">পাসওয়ার্ড</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-emerald-700 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'লগইন করুন'}
            </button>

            <p className="text-center text-xs text-gray-500 mt-3">
              নতুন অ্যাকাউন্ট তৈরি করতে চান?{' '}
              <button type="button" onClick={() => setMode('SIGNUP')} className="text-emerald-700 font-bold hover:underline">
                সাইন আপ করুন
              </button>
            </p>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck size={14} className="text-emerald-700" /> সুরক্ষিত ইমেল ওটিপি ভেরিফিকেশন সিস্টেম
        </div>
      </div>
    </div>
  );
         }
        
