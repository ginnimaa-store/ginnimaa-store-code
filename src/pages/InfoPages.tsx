import { useLang } from '@/context/LanguageContext';

export function About() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-amber-700 mb-4">{t('আমাদের সম্পর্কে', 'About GINNIMAA')}</h1>
      <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>
          {t(
            'GINNIMAA একটি বাংলা মাছ ও মাংস হোম ডেলিভারি পরিষেবা। আমরা সকালের তাজা মাছ, দেশি মুরগি ও কচি খাসির মাংস সরাসরি আপনার দরজায় পৌঁছে দিই।',
            'GINNIMAA is a Bengali fish and meat home delivery service. We bring fresh morning-caught fish, country chicken, and tender mutton directly to your doorstep.'
          )}
        </p>
        <p>
          {t(
            'বারাসাত, মধ্যমগ্রাম, ব্যারাকপুর, সোদপুর ও বিরাটি এলাকায় আমাদের ডেলিভারি সেবা উপলব্ধ। সকল মাছ ও মাংস হালাল কাটা ও স্বাস্থ্যসম্মতভাবে প্যাক করা হয়।',
            'We serve Barasat, Madhyamgram, Barrackpore, Sodepur, and Birati areas. All fish and meat is halal-cut and hygienically packed.'
          )}
        </p>
        <p>
          {t(
            '২০০ টাকার বেশি অর্ডারে ডেলিভারি ফ্রি! ক্যাশ অন ডেলিভারি এবং UPI QR পেমেন্ট উভয় সুবিধা উপলব্ধ।',
            'Free delivery on orders above Rs.200! Both Cash on Delivery and UPI QR payment options are available.'
          )}
        </p>
      </div>
    </div>
  );
}

export function Privacy() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-amber-700 mb-4">{t('প্রাইভেসি পলিসি', 'Privacy Policy')}</h1>
      <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>{t('আমরা আপনার ব্যক্তিগত তথ্য — নাম, মোবাইল নম্বর, ঠিকানা ও GPS লোকেশন — শুধুমাত্র অর্ডার ডেলিভারির জন্য ব্যবহার করি।', 'We use your personal information — name, phone number, address, and GPS location — solely for order delivery purposes.')}</p>
        <p>{t('আপনার তথ্য কোনো তৃতীয় পক্ষের সাথে শেয়ার করা হয় না। সমস্ত ডেটা নিরাপদ Supabase ডেটাবেসে সংরক্ষিত থাকে এবং Row Level Security দ্বারা সুরক্ষিত।', 'Your data is never shared with any third party. All data is stored in a secure Supabase database protected by Row Level Security.')}</p>
        <p>{t('আপনি যেকোনো সময় আপনার অ্যাকাউন্ট ডিলিট করতে পারেন। আপনার অর্ডার হিস্ট্রি আপনার লগইনের সাথে যুক্ত থাকে।', 'You can delete your account at any time. Your order history is linked to your login.')}</p>
      </div>
    </div>
  );
}

export function Refund() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-amber-700 mb-4">{t('রিফান্ড পলিসি', 'Refund Policy')}</h1>
      <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>{t('পেরিশেবল পণ্য (মাছ ও মাংস) ডেলিভারির পর রিটার্ন বা রিফান্ড প্রযোজ্য নয়।', 'Perishable items (fish and meat) are not eligible for return or refund after delivery.')}</p>
        <p>{t('যদি কোনো পণ্য ডেলিভারির সময় তাজা না থাকে বা ক্ষতিগ্রস্ত থাকে, ১ ঘন্টার মধ্যে আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন।', 'If any product is not fresh or is damaged at delivery, contact our customer support within 1 hour.')}</p>
        <p>{t('UPI পেমেন্টে ভুল হলে, যাচাই করার পর ৩-৫ কর্মদিবসের মধ্যে রিফান্ড প্রক্রিয়া করা হবে।', 'For incorrect UPI payments, refund will be processed within 3-5 business days after verification.')}</p>
      </div>
    </div>
  );
}

export function Contact() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-amber-700 mb-4">{t('যোগাযোগ', 'Contact Us')}</h1>
      <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs space-y-5 text-sm text-gray-700">
        <div>
          <p className="text-xs text-gray-500 font-medium">{t('হেল্পলাইন নম্বর', 'Helpline Number')}</p>
          <a href="tel:+919830000000" className="text-lg font-bold text-amber-700">+91 98300 00000</a>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{t('ইমেল', 'Email')}</p>
          <a href="mailto:support@ginnimaa.com" className="text-sm font-bold text-amber-700">support@ginnimaa.com</a>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{t('ঠিকানা', 'Address')}</p>
          <p className="font-medium text-gray-900">{t('বারাসাত, উত্তর ২৪ পরগনা, পশ্চিমবঙ্গ ৭০০১২৪', 'Barasat, North 24 Parganas, West Bengal 700124')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{t('সার্ভিস সময়', 'Service Hours')}</p>
          <p className="font-medium text-gray-900">{t('প্রতিদিন সকাল ৬টা — সন্ধ্যা ৯টা', 'Daily 6 AM — 9 PM')}</p>
        </div>
      </div>
    </div>
  );
}
