export function formatPrice(amount: number): string {
  return '₹' + amount.toFixed(0);
}

export function formatPriceDecimal(amount: number): string {
  return '₹' + amount.toFixed(2);
}

export function calculateDiscount(mrp: number, sellingPrice: number): number {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function generateOrderNumber(): string {
  const prefix = 'GIN';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
