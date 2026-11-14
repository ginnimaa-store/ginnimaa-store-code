import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, User, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/context/LanguageContext';

export function CustomerAuth() {
  const navigate = useNavigate();
  const { t } = useLang();
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
      setError(t('সবগুলো ঘর পূরণ করুন', 'Please fill in all fields'));
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError(t('সঠিক ১০ সংখ্যার মোবাইল নম্বর লিখুন', 'Enter a valid 10-digit mobile number'));
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

      // If email confirmation is OFF, signUp returns a session immediately — log in directly
      if (data.session) {
        localStorage.setItem('ginnimaa_session', JSON.stringify(data.session));
        setLoading(false);
        navigate('/');
        return;
      }

      // If no session returned, email confirmation is ON — show OTP verification
      setLoading(false);
      setSuccessMsg(t('আপনার ইমেলে একটি ওটিপি পাঠানো হয়েছে। কোডটি নিচে লিখুন।', 'An OTP has been sent to your email. Enter the code below.'));
      setMode('VERIFY_OTP');
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('সাইন আপ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'Sign up failed. Please try again.'));
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError(t('ওটিপি কোডটি লিখুন', 'Please enter the OTP code'));
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
      setError(t('ভুল ওটিপি কোড দিয়েছেন। দয়া করে সঠিক কোড দিন।', 'Incorrect OTP code. Please enter the correct code.'));
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('ইমেল এবং পাসওয়ার্ড দিন', 'Enter email and password'));
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
      setError(t('ইমেল বা পাসওয়ার্ড সঠিক নয়।', 'Incorrect email or password.'));
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
            {mode === 'SIGNUP' && t('কাস্টমার সাইন আপ', 'Customer Sign Up')}
            {mode === 'VERIFY_OTP' && t('ইমেল ওটিপি ভেরিফিকেশন', 'Email OTP Verification')}
            {mode === 'SIGNIN' && t('কাস্টমার লগইন', 'Customer Login')}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'SIGNUP' && t('আপনার বিবরণ দিয়ে নতুন অ্যাকাউন্ট তৈরি করুন', 'Create a new account with your details')}
            {mode === 'VERIFY_OTP' && t('আপনার ইমেলে পাঠানো ওটিপি কোডটি লিখুন', 'Enter the OTP code sent to your email')}
            {mode === 'SIGNIN' && t('আপনার ইমেল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন', 'Sign in with your email and password')}
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
              <label className="text-xs font-medium text-gray-700 block mb-1">{t('আপনার নাম', 'Your Name')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('সম্পূর্ণ নাম লিখুন', 'Enter your full name')}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">{t('ইমেল আইডি', 'Email ID')}</label>
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
              <label className="text-xs font-medium text-gray-700 block mb-1">{t('মোবাইল নম্বর', 'Mobile Number')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Phone size={16} /></span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={t('১০ সংখ্যার মোবাইল নম্বর', '10-digit mobile number')}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">{t('পাসওয়ার্ড', 'Password')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Lock size={16} /></span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড', 'At least 6 character password')}
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : t('সাইন আপ ও ওটিপি পাঠান', 'Sign Up & Send OTP')}
            </button>

            <p className="text-center text-xs text-gray-500 mt-3">
              {t('আগে থেকেই অ্যাকাউন্ট আছে?', 'Already have an account?')}{' '}
              <button type="button" onClick={() => setMode('SIGNIN')} className="text-emerald-700 font-bold hover:underline">
                {t('লগইন করুন', 'Login')}
              </button>
            </p>
          </form>
        )}

        {mode === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">{t('ইমেলে পাওয়া ওটিপি কোড', 'OTP code from email')}</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder={t('যেমন: 123456', 'e.g. 123456')}
                className="w-full px-4 py-3 text-center tracking-widest font-bold text-lg bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-700 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : t('ওটিপি যাচাই করুন', 'Verify OTP')}
            </button>
          </form>
        )}

        {mode === 'SIGNIN' && (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">{t('ইমেল আইডি', 'Email ID')}</label>
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
              <label className="text-xs font-medium text-gray-700 block mb-1">{t('পাসওয়ার্ড', 'Password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('আপনার পাসওয়ার্ড', 'Your password')}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-emerald-700 text-white rounded-xl font-bold text-sm hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : t('লগইন করুন', 'Login')}
            </button>

            <p className="text-center text-xs text-gray-500 mt-3">
              {t('নতুন অ্যাকাউন্ট তৈরি করতে চান?', 'Want to create a new account?')}{' '}
              <button type="button" onClick={() => setMode('SIGNUP')} className="text-emerald-700 font-bold hover:underline">
                {t('সাইন আপ করুন', 'Sign Up')}
              </button>
            </p>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck size={14} className="text-emerald-700" /> {t('সুরক্ষিত ইমেল ওটিপি ভেরিফিকেশন সিস্টেম', 'Secure email OTP verification system')}
        </div>
      </div>
    </div>
  );
}
