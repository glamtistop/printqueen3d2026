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
import PageTransition from './components/PageTransition';
import { Toaster } from './components/ui/sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext();

// Cart Context
export const CartContext = React.createContext();

// Animated Routes Component
const AnimatedRoutes = ({ user }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
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

  // Check for session_id in URL fragment
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      processSession(sessionId);
    } else {
      checkAuth();
    }

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const processSession = async (sessionId) => {
    try {
      const response = await axios.post(
        `${API}/auth/session`,
        {},
        {
          headers: {
            'X-Session-ID': sessionId
          },
          withCredentials: true
        }
      );
      setUser(response.data);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Session processing failed:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading OS...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, checkAuth }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartQuantity, clearCart }}>
        <div className="App bg-slate-50 min-h-screen font-sans text-slate-900">
          <BrowserRouter>
            <AnimatedRoutes user={user} />
          </BrowserRouter>
          <Toaster position="top-right" theme="light" />
        </div>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
