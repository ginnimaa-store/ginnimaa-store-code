export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  image_url: string | null;
  mrp: number;
  selling_price: number;
  pack_size: string | null;
  net_weight?: number;
  weight_unit?: 'gm' | 'kg' | 'piece' | string;
  is_featured: boolean;
  is_best_seller: boolean;
  is_on_offer: boolean;
  stock: number;
  active: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  pin_code: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  product: Product | null;
}

export interface OrderItemJson {
  product_id: string;
  product_name: string;
  product_image: string | null;
  pack_size: string | null;
  selling_price: number;
  mrp: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  mobile_number: string;
  address: string;
  pin_code: string;
  latitude?: number;
  longitude?: number;
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  payment_status?: 'PENDING' | 'VERIFIED' | 'FAILED' | string;
  payment_ref_id?: string | null;
  status: string;
  delivery_partner_id?: string | null;
  delivery_partner_name?: string | null;
  items_json: OrderItemJson[] | null;
  created_at: string;
  customer: Customer | null;
  order_items: OrderItem[];
}

export interface ServiceablePinCode {
  pin_code: string;
  area_name: string;
  delivery_charge: number;
  is_active: boolean;
  }
