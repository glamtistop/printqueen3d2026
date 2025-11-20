import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { ShoppingCart, Package, Shield, Zap, Menu, X, LogOut, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const LandingPage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/products`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen">
      {/* Announcement Bar */}
      <div className="announcement-bar">
        ✨ Free Shipping on Orders Over $75 | Use Code: FREESHIP75 ✨
      </div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <Package className="h-10 w-10 text-blue-600" />
              <span className="logo-text">
                Print Queen 3D
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors" data-testid="products-link">
                Products
              </Link>
              {user ? (
                <>
                  <Link to="/cart" className="text-gray-700 hover:text-blue-600 transition-colors" data-testid="cart-link">
                    <ShoppingCart className="h-6 w-6" />
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu">
                        <User className="h-5 w-5" />
                        <span>{user.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate('/orders')} data-testid="my-orders-link">
                        My Orders
                      </DropdownMenuItem>
                      {user.is_admin && (
                        <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="admin-link">
                          Admin Dashboard
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={logout} data-testid="logout-button">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button onClick={handleLogin} className="btn-primary" data-testid="login-button">
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link
                to="/products"
                className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              {user ? (
                <>
                  <Link
                    to="/cart"
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Cart
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  {user.is_admin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="block w-full text-left px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" data-testid="hero-section">
        <div className="hero-content fade-in-up">
          <div className="hero-badge">✨ Premium 3D Printed Creations</div>
          <h1 className="hero-title">
            Welcome to Print Queen 3D
          </h1>
          <p className="hero-subtitle">
            Discover our curated collection of stunning 3D printed products. From elegant decor to functional accessories, each piece is crafted with precision and care.
          </p>
          <div className="hero-buttons">
            <Link to="/products">
              <button className="btn-primary" data-testid="explore-products-button">
                Shop Collection
              </button>
            </Link>
            {!user && (
              <button onClick={handleLogin} className="btn-secondary">
                Sign In
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" data-testid="categories-section">
        <div className="max-w-7xl mx-auto">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find exactly what you're looking for</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Art & Decor', color: 'from-blue-400 to-blue-600', icon: '🎨' },
              { name: 'Accessories', color: 'from-green-400 to-green-600', icon: '✨' },
              { name: 'Office', color: 'from-yellow-400 to-yellow-600', icon: '📋' },
              { name: 'Home & Garden', color: 'from-pink-400 to-pink-600', icon: '🌿' }
            ].map((category, index) => (
              <Link key={index} to={`/products?category=${category.name}`} className="group">
                <div className="product-card p-8 text-center hover:scale-105 transition-transform">
                  <div className={`text-5xl mb-4 group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="promo-banner">
            <h2 className="promo-title">New Arrivals Daily! 🎉</h2>
            <p className="promo-subtitle">Check back often for fresh designs and exclusive drops</p>
            <Link to="/products">
              <button className="btn-primary">Browse New Items</button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="section-header">
            <h2 className="section-title">Why Print Queen 3D?</h2>
            <p className="section-subtitle">Quality you can trust, service you'll love</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="product-card p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Premium Quality</h3>
              <p className="text-gray-600">
                Every print is crafted with precision using top-tier materials and cutting-edge 3D printing technology.
              </p>
            </div>

            <div className="product-card p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Fast Turnaround</h3>
              <p className="text-gray-600">
                Quick processing times mean you get your beautiful 3D prints delivered to your door faster.
              </p>
            </div>

            <div className="product-card p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Secure Shopping</h3>
              <p className="text-gray-600">
                Shop with confidence using our secure checkout powered by Stripe. Your data is always protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-header">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real reviews from happy customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                "Amazing quality! The detail on my dragon sculpture is incredible. Print Queen 3D never disappoints!"
              </p>
              <p className="testimonial-author">- Sarah M.</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                "Fast shipping and beautiful products. The phone stand is perfect for my desk. Highly recommend!"
              </p>
              <p className="testimonial-author">- Mike R.</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                "Love my geometric planter! It's exactly as pictured and the quality exceeded my expectations."
              </p>
              <p className="testimonial-author">- Emily K.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto promo-banner border-yellow-400">
          <h2 className="promo-title" style={{ color: '#1e293b' }}>
            Ready to Elevate Your Space?
          </h2>
          <p className="promo-subtitle" style={{ color: '#475569' }}>
            Discover unique 3D printed pieces that bring personality and function to your life
          </p>
          <Link to="/products">
            <button className="btn-primary text-lg px-10 py-4" data-testid="shop-now-button">
              Start Shopping
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-10 w-10 text-blue-400" />
              <span className="logo-text" style={{ WebkitTextFillColor: 'white' }}>Print Queen 3D</span>
            </div>
            <p className="text-gray-400">
              Premium 3D printed products crafted with precision and care. Bringing your imagination to life, one layer at a time.
            </p>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/products">Shop All</Link></li>
              <li><Link to="/products">New Arrivals</Link></li>
              <li><Link to="/">About Us</Link></li>
              <li><Link to="/">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Customer Care</h3>
            <ul className="footer-links">
              <li><Link to="/orders">Track Order</Link></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Connect With Us</h3>
            <ul className="footer-links">
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">Pinterest</a></li>
              <li><a href="#">TikTok</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Print Queen 3D. All rights reserved. Made with ♥ for 3D print lovers.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;