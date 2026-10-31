import { useEffect, useState, type FormEvent } from 'react';
import { MessageCircle, Save } from 'lucide-react';
import { fetchWhatsAppNumber, saveWhatsAppNumber } from '@/lib/settings';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp';

export function AdminSettings() {
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchWhatsAppNumber()
      .then(setNumber)
      .catch(() => setError('Could not load settings. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    const normalized = normalizeWhatsAppNumber(number);
    if (!normalized) {
      setError('Enter a valid WhatsApp number, for example 9876543210 or +91 98765 43210.');
      return;
    }

    setSaving(true);
    try {
      await saveWhatsAppNumber(normalized);
      setNumber(normalized);
      setSaved(true);
    } catch {
      setError('Could not save the number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
            <MessageCircle size={20} className="text-green-700" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">WhatsApp Orders</h2>
            <p className="text-xs text-gray-500">Customers send their order details to this number after placing an order.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-3 border-green-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-5 space-y-3">
            <label htmlFor="whatsapp-number" className="block text-sm font-medium text-gray-700">
              WhatsApp number
            </label>
            <input
              id="whatsapp-number"
              type="tel"
              inputMode="tel"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                setSaved(false);
              }}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-500">
              Enter a 10-digit Indian number, or include the country code. The number is saved with country code 91 added for 10-digit numbers.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            {saved && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">WhatsApp number saved.</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-green-700 text-white hover:bg-green-800 disabled:opacity-60 transition-colors"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Number'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
