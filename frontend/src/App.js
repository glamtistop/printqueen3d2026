import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboardNew';
import LoginPage from './pages/LoginPage';
import { AboutPage, ContactPage, CorporateBulkOrdersPage, DesignYourOwnPage, MaterialsPage, PersonalizePage, PolicyPage } from './pages/MarketingPages';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import AddToHomeScreenPrompt from './components/AddToHomeScreenPrompt';
import { Toaster } from './components/ui/sonner';
import { ROUTE_META, setPageMeta, removeProductJsonLd } from './lib/seo';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext();

// Cart Context
export const CartContext = React.createContext();

// Sets the SEO title/description for every static route; product and
// collection pages refine these after their data loads.
const RouteMeta = () => {
  const location = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[location.pathname];
    if (meta) {
      setPageMeta({ ...meta, path: location.pathname });
    }
    if (!location.pathname.startsWith('/products/')) {
      removeProductJsonLd();
    }
  }, [location.pathname]);

  return null;
};

// Animated Routes Component
const AnimatedRoutes = ({ user }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/personalize" element={<PageTransition><PersonalizePage /></PageTransition>} />
        <Route path="/shop" element={<PageTransition><ProductsPage /></PageTransition>} />
        <Route path="/design-your-own" element={<PageTransition><DesignYourOwnPage /></PageTransition>} />
        <Route path="/custom-order" element={<PageTransition><DesignYourOwnPage /></PageTransition>} />
        <Route path="/corporate-bulk-orders" element={<PageTransition><CorporateBulkOrdersPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/refund-policy" element={<PageTransition><PolicyPage sectionId="refund_policy_page" /></PageTransition>} />
        <Route path="/product-care" element={<PageTransition><PolicyPage sectionId="product_care_page" /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PolicyPage sectionId="privacy_policy_page" /></PageTransition>} />
        <Route path="/terms-of-service" element={<PageTransition><PolicyPage sectionId="terms_of_service_page" /></PageTransition>} />
        <Route path="/shipping-policy" element={<PageTransition><PolicyPage sectionId="shipping_policy_page" /></PageTransition>} />
        <Route path="/materials" element={<PageTransition><MaterialsPage /></PageTransition>} />
        <Route path="/products" element={<PageTransition><ProductsPage /></PageTransition>} />
        <Route path="/products/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
        <Route path="/nfc-stand" element={<Navigate to="/products/nfc-stand-custom" replace />} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/checkout" element={user ? <PageTransition><CheckoutPage /></PageTransition> : <Navigate to="/" />} />
        <Route path="/order-success" element={user ? <PageTransition><OrderSuccessPage /></PageTransition> : <Navigate to="/" />} />
        <Route path="/orders" element={user ? <PageTransition><OrdersPage /></PageTransition> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.is_admin ? <PageTransition><AdminDashboard /></PageTransition> : <Navigate to="/login" />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    checkAuth();

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
        }
      });
      setUser(response.data);
    } catch (error) {
      console.log('Not authenticated:', error.response?.status);
      // Not authenticated - this is fine
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const addToCart = (product, quantity = 1, variant = null) => {
    const newCart = [...cart];
    const existingIndex = newCart.findIndex(
      item => item.id === product.id && JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart.push({
        ...product,
        quantity,
        variant
      });
    }

    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateCartQuantity = (index, quantity) => {
    const newCart = [...cart];
    if (quantity <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].quantity = quantity;
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-blue-50 px-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-blue-100">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-blue-500 animate-spin"></div>
            <img
              src="/printqueen-logo.png"
              alt="Print Queen 3D"
              className="relative z-10 h-16 w-16 object-contain"
            />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">Print Queen 3D</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Opening your custom 3D print studio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, checkAuth }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartQuantity, clearCart }}>
        <div className="App bg-slate-50 min-h-screen font-sans text-slate-900">
          <BrowserRouter>
            <ScrollToTop />
            <RouteMeta />
            <AnimatedRoutes user={user} />
          </BrowserRouter>
          <Toaster position="top-right" theme="light" />
          <AddToHomeScreenPrompt />
        </div>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
