import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';
import { Home } from '@/components/Home';
import { Products } from '@/components/Products';
import { ProductDetail } from '@/components/ProductDetail';
import { Cart } from '@/components/Cart';
import { Checkout } from '@/components/Checkout';
import { OrderConfirmation } from '@/components/OrderConfirmation';
import { CustomerAuth } from '@/components/CustomerAuth';
import { CustomerProfile } from '@/components/CustomerProfile';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminPincodes } from '@/components/admin/AdminPincodes';
import { Footer } from '@/components/Footer';

export function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="pincodes" element={<AdminPincodes />} />
            </Route>

            {/* Customer & Storefront Routes */}
            <Route
              path="*"
              element={
                <>
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                      
                      {/* নতুন কাস্টমার অথ এবং প্রোফাইল রাউট */}
                      <Route path="/auth" element={<CustomerAuth />} />
                      <Route path="/profile" element={<CustomerProfile />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              }
            />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
              
