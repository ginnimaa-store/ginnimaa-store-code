import { formatPrice } from '@/lib/format';

export interface OrderLine {
  product_name: string;
  pack_size: string | null;
  quantity: number;
  line_total: number;
}

export interface OrderSummary {
  order_number: string;
  customer_name: string;
  mobile_number: string;
  address: string;
  pin_code: string;
  total: number;
  payment_method: string;
}

export function normalizeWhatsAppNumber(input: string): string | null {
  const digits = input.replace(/[\s()+-]/g, '');
  if (!/^\d{10,15}$/.test(digits)) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

export function buildOrderMessage(order: OrderSummary, lines: OrderLine[]): string {
  const productLines = lines.map((line, index) => {
    const pack = line.pack_size ? ` (${line.pack_size})` : '';
    return `${index + 1}. ${line.product_name}${pack} - Qty: ${line.quantity} - ${formatPrice(line.line_total)}`;
  });

  return [
    'GINNIMAA ORDER',
    '',
    `Order ID: ${order.order_number}`,
    `Customer Name: ${order.customer_name}`,
    `Mobile: ${order.mobile_number}`,
    `Address: ${order.address}`,
    `PIN: ${order.pin_code}`,
    '',
    'Products:',
    ...productLines,
    '',
    `Total Amount: ${formatPrice(order.total)}`,
    `Payment Method: ${order.payment_method}`,
  ].join('\n');
}

export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
