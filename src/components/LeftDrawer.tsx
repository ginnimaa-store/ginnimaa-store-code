import { Link } from 'react-router-dom';
import { X, Info, Shield, RotateCcw, Mail, Home, Package, Grid, ShoppingCart } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

interface LeftDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function LeftDrawer({ open, onClose }: LeftDrawerProps) {
  const { t } = useLang();

  const links = [
    { to: '/about', icon: Info, label: t('আমাদের সম্পর্কে', 'About Company') },
    { to: '/privacy', icon: Shield, label: t('প্রাইভেসি পলিসি', 'Privacy Policy') },
    { to: '/refund', icon: RotateCcw, label: t('রিফান্ড পলিসি', 'Refund Policy') },
    { to: '/contact', icon: Mail, label: t('যোগাযোগ', 'Contact Us') },
  ];

  const navLinks = [
    { to: '/', icon: Home, label: t('হোম', 'Home') },
    { to: '/products', icon: Package, label: t('সকল পণ্য', 'All Products') },
    { to: '/categories', icon: Grid, label: t('ক্যাটাগরি', 'Categories') },
    { to: '/cart', icon: ShoppingCart, label: t('কার্ট', 'Cart') },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-amber-50">
          <span className="text-xl font-black text-amber-600 tracking-tight">GINNIMAA</span>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          <div className="p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1.5">{t('নেভিগেশন', 'Navigation')}</p>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors">
                <l.icon size={18} className="text-amber-600" /> {l.label}
              </Link>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1.5">{t('কোম্পানি', 'Company')}</p>
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors">
                <l.icon size={18} className="text-amber-600" /> {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
