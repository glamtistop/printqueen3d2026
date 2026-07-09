import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
// The landing page loads eagerly (it is the most common entry point). Every other
// route is code-split so customers do not download the admin dashboard, checkout,
// product, and marketing bundles just to view the homepage.
import LandingPage from './pages/LandingPage';

// If a customer keeps an old tab open across a deploy, the code-split chunk
// filenames change and the old chunk 404s — leaving a stuck blank page. Retry
// once with a clean reload (guarded so it can never loop).
const lazyWithReload = (importer) => lazy(() =>
  importer().catch((error) => {
    const alreadyReloaded = sessionStorage.getItem('pq-chunk-reloaded');
    if (!alreadyReloaded) {
      sessionStorage.setItem('pq-chunk-reloaded', '1');
      window.location.reload();
      return new Promise(() => {});
    }
    throw error;
  })
);

const ProductsPage = lazyWithReload(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazyWithReload(() => import('./pages/ProductDetailPage'));
const CartPage = lazyWithReload(() => import('./pages/CartPage'));
const CheckoutPage = lazyWithReload(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazyWithReload(() => import('./pages/OrderSuccessPage'));
const OrdersPage = lazyWithReload(() => import('./pages/OrdersPage'));
const AdminDashboard = lazyWithReload(() => import('./pages/AdminDashboardNew'));
const LoginPage = lazyWithReload(() => import('./pages/LoginPage'));
const AboutPage = lazyWithReload(() => import('./pages/MarketingPages').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazyWithReload(() => import('./pages/MarketingPages').then((m) => ({ default: m.ContactPage })));
const CorporateBulkOrdersPage = lazyWithReload(() => import('./pages/MarketingPages').then((m) => ({ default: m.CorporateBulkOrdersPage })));
const DesignYourOwnPage = lazyWithReload(() => import('./pages/MarketingPages').then((m) => ({ default: m.DesignYourOwnPage })));
const MaterialsPage = lazyWithReload(() => import('./pages/MarketingPages').then((m) => ({ default: m.MaterialsPage })));
const PersonalizePage = lazyWithReload(() => import('./pages/MarketingPages').then((m) => ({ default: m.PersonalizePage })));
const PolicyPage = lazyWithReload(() => import('./pages/MarketingPages').then((m) => ({ default: m.PolicyPage })));
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import AddToHomeScreenPrompt from './components/AddToHomeScreenPrompt';
import SupportWidget from './components/SupportWidget';
import { Toaster } from './components/ui/sonner';
import { ROUTE_META, setPageMeta, removeProductJsonLd, removeBreadcrumbJsonLd, removeFaqJsonLd } from './lib/seo';
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
    if (location.pathname !== '/' && location.pathname !== '/shop' && location.pathname !== '/products') {
      removeFaqJsonLd();
    }
    if (!location.pathname.startsWith('/products/') && location.pathname !== '/shop' && location.pathname !== '/products') {
      removeBreadcrumbJsonLd();
    }
  }, [location.pathname]);

  return null;
};

// Animated Routes Component
const AnimatedRoutes = ({ user }) => {
  const location = useLocation();

  return (
    <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
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
    </Suspense>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const protectedPaths = ['/admin', '/checkout', '/orders', '/order-success'];
  const shouldWaitForAuth = protectedPaths.some((path) => window.location.pathname.startsWith(path));

  useEffect(() => {
    checkAuth();

    // Load cart from localStorage. A corrupted saved cart must never be able
    // to blank the whole site, so parse defensively and discard bad data.
    try {
      const savedCart = localStorage.getItem('cart');
      const parsed = savedCart ? JSON.parse(savedCart) : null;
      if (Array.isArray(parsed)) {
        setCart(parsed);
      } else if (savedCart) {
        localStorage.removeItem('cart');
      }
    } catch (error) {
      localStorage.removeItem('cart');
    }

    // Clear the chunk-reload guard once the app has booted successfully.
    sessionStorage.removeItem('pq-chunk-reloaded');
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

  if (loading && shouldWaitForAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-white/70">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200 border-t-cyan-300 animate-spin"></div>
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
        <div className="App min-h-screen font-sans text-slate-900">
          <BrowserRouter>
            <ScrollToTop />
            <RouteMeta />
            <AnimatedRoutes user={user} />
            <SupportWidget />
          </BrowserRouter>
          <Toaster position="top-right" theme="light" />
          <AddToHomeScreenPrompt />
        </div>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
