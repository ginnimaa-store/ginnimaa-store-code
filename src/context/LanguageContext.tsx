import { createContext, useContext, useState, type ReactNode } from 'react';

type Lang = 'bn' | 'en';

interface LanguageContextType {
  lang: Lang;
  toggle: () => void;
  setLang: (l: Lang) => void;
  t: (bn: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('ginnimaa_lang');
    return saved === 'en' ? 'en' : 'bn';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('ginnimaa_lang', l);
  };

  const toggle = () => setLang(lang === 'bn' ? 'en' : 'bn');

  const t = (bn: string, en: string) => (lang === 'bn' ? bn : en);

  return (
    <LanguageContext.Provider value={{ lang, toggle, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
