import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import LandingPage from './pages/LandingPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboardNew';
import NFCStandPage from './pages/NFCStandPage';
import LoginPage from './pages/LoginPage';
import { Toaster } from './components/ui/sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext();

// Cart Context
export const CartContext = React.createContext();

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, checkAuth }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartQuantity, clearCart }}>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/nfc-stand" element={<NFCStandPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={user ? <CheckoutPage /> : <Navigate to="/" />} />
              <Route path="/order-success" element={user ? <OrderSuccessPage /> : <Navigate to="/" />} />
              <Route path="/orders" element={user ? <OrdersPage /> : <Navigate to="/" />} />
              <Route path="/admin" element={user?.is_admin ? <AdminDashboard /> : <Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </div>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;