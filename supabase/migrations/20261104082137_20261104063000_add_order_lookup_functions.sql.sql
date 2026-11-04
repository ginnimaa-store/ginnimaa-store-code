/*
# Add lookup_order_by_otp function

Allows a customer to look up their own order by ID + delivery OTP.
This replaces the old anon SELECT on orders, which exposed all customer data.
Returns only the fields needed for the order confirmation page.

Security: SECURITY DEFINER, revokes public/anon, grants anon + authenticated.
The function only returns a row if the delivery_otp matches, acting as a receipt token.
*/

CREATE OR REPLACE FUNCTION public.lookup_order_by_otp(
  p_order_id uuid,
  p_otp text
)
RETURNS TABLE(
  id uuid,
  order_number text,
  customer_name text,
  mobile_number text,
  address text,
  pin_code text,
  subtotal numeric,
  delivery_charge numeric,
  total numeric,
  payment_method text,
  payment_status text,
  status text,
  delivery_status text,
  delivery_otp text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.order_number, o.customer_name, o.mobile_number,
    o.address, o.pin_code, o.subtotal, o.delivery_charge, o.total,
    o.payment_method, o.payment_status, o.status, o.delivery_status,
    o.delivery_otp, o.created_at
  FROM public.orders o
  WHERE o.id = p_order_id
    AND o.delivery_otp = p_otp
    AND o.delivery_otp IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_order_by_otp(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_by_otp(uuid, text) TO anon, authenticated;

-- Also: function to lookup order items by order ID + OTP (same security model)
CREATE OR REPLACE FUNCTION public.lookup_order_items_by_otp(
  p_order_id uuid,
  p_otp text
)
RETURNS TABLE(
  id uuid,
  order_id uuid,
  product_id uuid,
  quantity integer,
  price numeric,
  weight_option text,
  cut_preference text,
  product_name text,
  product_image text,
  pack_size text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price,
    oi.weight_option, oi.cut_preference,
    p.name AS product_name,
    p.image_url AS product_image,
    p.pack_size AS pack_size
  FROM public.order_items oi
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = p_order_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = p_order_id
        AND o.delivery_otp = p_otp
        AND o.delivery_otp IS NOT NULL
    );
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_order_items_by_otp(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_items_by_otp(uuid, text) TO anon, authenticated;
