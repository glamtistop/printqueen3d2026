import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { ShoppingCart, Package, Shield, Zap, Menu, X, LogOut, User, ChevronRight, Star } from 'lucide-react';
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
  const [email, setEmail] = useState('');

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

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    alert(`Thanks for joining! Check ${email} for your 10% off code.`);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Bar */}
      <div className="announcement-bar text-center">
        <div className="inline-flex items-center space-x-2 animate-marquee">
          <span>Fast & reliable U.S. shipping</span>
          <span>·</span>
          <span>Local pickup in Los Angeles, Altadena, Long Beach, Hawthorne, West Covina</span>
          <span>·</span>
          <span>Handmade 3D printed designs made to order in LA</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img 
                src="/printqueen-logo.png" 
                alt="Print Queen 3D" 
                className="h-16 w-auto"
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors" data-testid="products-link">
                Shop
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
                Shop
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

      {/* Hero Banner */}
      <section className="relative w-full overflow-hidden" style={{ marginTop: '88px' }}>
        <img
          src="https://printqueen3d-storefront1.vercel.app/mobilebanner.png"
          alt="Print Queen 3D Hero"
          className="w-full h-auto object-cover"
          style={{ maxHeight: '600px' }}
        />
      </section>

      {/* Category Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/nfc-stand" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <img
              src="https://printqueen3d-storefront1.vercel.app/paymentstands.PNG"
              alt="Payment Stands"
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-1">Payment Stands</h3>
                <p className="text-sm opacity-90">Custom NFC solutions</p>
              </div>
            </div>
          </Link>

          <Link to="/products" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <img
              src="https://printqueen3d-storefront1.vercel.app/custom3dprints.PNG"
              alt="Custom 3D Prints"
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-1">Custom 3D Prints</h3>
                <p className="text-sm opacity-90">Made to order designs</p>
              </div>
            </div>
          </Link>

          <Link to="/products" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <img
              src="https://printqueen3d-storefront1.vercel.app/nfckeychain.png"
              alt="NFC Keychains"
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-2xl font-bold mb-1">Keychains</h3>
                <p className="text-sm opacity-90">NFC enabled accessories</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Shop Categories */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Payment Stands', link: '/nfc-stand' },
              { name: 'Keychains', link: '/products' },
              { name: 'Home Decor', link: '/products' },
              { name: 'Incense Holders', link: '/products' },
              { name: 'Toys & Fidgets', link: '/products' },
              { name: 'Custom 3D Prints', link: '/products' }
            ].map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className="product-card p-6 text-center hover:scale-105 transition-transform duration-300"
              >
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center mb-16">Why Choose Print Queen 3D?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="text-5xl">⚡</div>
              <h3 className="text-xl font-bold text-gray-900">Fast Turnaround</h3>
              <p className="text-gray-600">1-3 day processing for quick delivery</p>
            </div>

            <div className="text-center space-y-4">
              <div className="text-5xl">🎯</div>
              <h3 className="text-xl font-bold text-gray-900">Precision Quality</h3>
              <p className="text-gray-600">Professional-grade 3D printing</p>
            </div>

            <div className="text-center space-y-4">
              <div className="text-5xl">💡</div>
              <h3 className="text-xl font-bold text-gray-900">Expert Support</h3>
              <p className="text-gray-600">Guidance from concept to completion</p>
            </div>

            <div className="text-center space-y-4">
              <div className="text-5xl">🏙️</div>
              <h3 className="text-xl font-bold text-gray-900">Local LA Service</h3>
              <p className="text-gray-600">Supporting local businesses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Want 10% off?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the royal list for new drops, exclusive offers, and a 10% welcome coupon. We send good vibes only.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            <button
              type="submit"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Get my 10%
            </button>
          </form>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center mb-8">Your Vision, Printed Perfectly.</h2>
          <p className="text-lg text-gray-600 leading-relaxed text-center">
            Print Queen 3D turns creativity into tangible design. We specialize in premium, made-to-order 3D prints—NFC payment stands, QR displays, personalized keychains and charms, lithophane lamps, vases, fidgets, and custom pieces for events and brands. Every item is printed locally in LA with quality materials, then checked by hand for a clean, professional finish. Whether you're a business that needs smart, on-brand tools or you're gifting something one-of-a-kind, we deliver fast, friendly service and precision results. Your ideas deserve to be printed perfectly.
          </p>
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
              <li><Link to="/nfc-stand">NFC Stands</Link></li>
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
            <h3>Location</h3>
            <p className="text-gray-400">
              Los Angeles, CA<br />
              Serving: Altadena, Long Beach,<br />
              Hawthorne, West Covina
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Print Queen 3D. All rights reserved. Made with ♥ in LA for 3D print lovers.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;