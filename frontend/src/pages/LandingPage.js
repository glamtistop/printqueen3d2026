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
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                3D Prints
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
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center space-y-8 fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Transform Your Ideas Into
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-green-600 to-yellow-500 bg-clip-text text-transparent">
                Beautiful 3D Prints
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our premium collection of custom 3D printed products. From art pieces to functional designs, we bring your imagination to life with cutting-edge technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/products">
                <Button className="btn-primary text-lg px-8 py-6" data-testid="explore-products-button">
                  Explore Products
                </Button>
              </Link>
              {!user && (
                <Button onClick={handleLogin} variant="outline" className="text-lg px-8 py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <div className="section-divider">
        <div className="wave"></div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600">Premium quality meets innovative design</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card rounded-2xl p-8 text-center space-y-4 fade-in">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Premium Quality</h3>
              <p className="text-gray-600">
                Every print is crafted with precision using top-tier materials and advanced printing technology.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center space-y-4 fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick turnaround times without compromising on quality. Get your prints delivered fast.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center space-y-4 fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Secure Checkout</h3>
              <p className="text-gray-600">
                Shop with confidence using our secure payment system powered by Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto glass-card rounded-3xl p-12 text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Ready to Start Creating?
          </h2>
          <p className="text-xl text-gray-600">
            Browse our collection and bring your ideas to life today.
          </p>
          <Link to="/products">
            <Button className="btn-secondary text-lg px-8 py-6" data-testid="shop-now-button">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">3D Prints</span>
          </div>
          <p className="text-gray-400">
            © 2025 3D Prints Store. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;