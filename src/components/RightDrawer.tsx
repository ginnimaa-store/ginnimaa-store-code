import { Link } from 'react-router-dom';
import { X, Headphones, MessageCircle, Home, Package, Grid, ShoppingCart, User, Info, Shield, RotateCcw, Mail } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { fetchWhatsAppNumber } from '@/lib/settings';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function RightDrawer({ open, onClose }: RightDrawerProps) {
  const { t } = useLang();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const isCustomerLoggedIn = localStorage.getItem('ginnimaa_session');

  useEffect(() => {
    fetchWhatsAppNumber().then(setWhatsappNumber).catch(() => setWhatsappNumber(''));
  }, []);

  const normalizedWhatsApp = normalizeWhatsAppNumber(whatsappNumber);
  const whatsappUrl = normalizedWhatsApp
    ? `https://wa.me/${normalizedWhatsApp}?text=${encodeURIComponent('Hello GINNIMAA, I need help with my order.')}`
    : null;

  const navLinks = [
    { to: '/', icon: Home, label: t('হোম', 'Home') },
    { to: '/products', icon: Package, label: t('সকল পণ্য', 'All Products') },
    { to: '/categories', icon: Grid, label: t('ক্যাটাগরি', 'Categories') },
    { to: '/cart', icon: ShoppingCart, label: t('কার্ট', 'Cart') },
    { to: isCustomerLoggedIn ? '/profile' : '/auth', icon: User, label: isCustomerLoggedIn ? t('প্রোফাইল', 'My Profile') : t('লগইন', 'Login') },
  ];

  const infoLinks = [
    { to: '/about', icon: Info, label: t('আমাদের সম্পর্কে', 'About Company') },
    { to: '/privacy', icon: Shield, label: t('প্রাইভেসি পলিসি', 'Privacy Policy') },
    { to: '/refund', icon: RotateCcw, label: t('রিফান্ড পলিসি', 'Refund Policy') },
    { to: '/contact', icon: Mail, label: t('যোগাযোগ', 'Contact Us') },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-amber-50">
          <span className="text-xl font-black text-amber-600 tracking-tight">GINNIMAA</span>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          <div className="p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1.5">{t('মেনু', 'Menu')}</p>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors">
                <l.icon size={18} className="text-amber-600" /> {l.label}
              </Link>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1.5">{t('কোম্পানি', 'Company')}</p>
            {infoLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors">
                <l.icon size={18} className="text-amber-600" /> {l.label}
              </Link>
            ))}
          </div>

          {/* Customer Support Section */}
          <div className="p-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1.5">{t('কাস্টমার সাপোর্ট', 'Customer Support')}</p>
            <div className="bg-amber-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Headphones size={16} className="text-amber-600" />
                <div>
                  <p className="text-[10px] text-gray-500">{t('হেল্পলাইন', 'Helpline')}</p>
                  <a href="tel:+919830000000" className="font-bold text-gray-900 text-sm">+91 98300 00000</a>
                </div>
              </div>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5a] transition-colors"
                >
                  <MessageCircle size={16} /> {t('হোয়াটসঅ্যাপ সাপোর্ট', 'WhatsApp Support')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
