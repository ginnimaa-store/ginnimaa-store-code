import { supabase } from '@/lib/supabase';

const WHATSAPP_NUMBER_KEY = 'whatsapp_number';

export async function fetchWhatsAppNumber(): Promise<string> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', WHATSAPP_NUMBER_KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.value ?? '';
}

export async function saveWhatsAppNumber(value: string): Promise<void> {
  const { error } = await supabase
    .from('store_settings')
    .upsert({ key: WHATSAPP_NUMBER_KEY, value }, { onConflict: 'key' });

  if (error) throw new Error(error.message);
}
