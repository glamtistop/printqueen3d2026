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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [email, setEmail] = useState('');

  const bannerImages = [
    'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/3gxh6aog_custom3dprints.PNG',
    'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/gzhz9uee_paymentstands.PNG',
    'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/cmhra1j0_nfckeychain.png'
  ];

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

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
      {/* Navbar */}
      <nav className="navbar">
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

      {/* Marquee - Pink Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-400 via-pink-500 to-pink-400 text-white py-3" style={{ marginTop: '104px' }}>
        <div className="inline-flex items-center space-x-2 animate-marquee whitespace-nowrap">
          <span className="font-medium">Fast & reliable U.S. shipping</span>
          <span>·</span>
          <span className="font-medium">Local pickup in Los Angeles, Altadena, Long Beach, Hawthorne, West Covina</span>
          <span>·</span>
          <span className="font-medium">Handmade 3D printed designs made to order in LA</span>
          <span>·</span>
          <span className="font-medium">Fast & reliable U.S. shipping</span>
          <span>·</span>
          <span className="font-medium">Local pickup in Los Angeles, Altadena, Long Beach, Hawthorne, West Covina</span>
        </div>
      </div>

      {/* Hero Banner - Auto-rotating Carousel (Desktop) / Static Banner (Mobile) */}
      <section className="relative w-full bg-gray-100">
        {/* Desktop Banner - Carousel */}
        <div className="hidden md:block relative w-full">
          <img
            src={bannerImages[currentBannerIndex]}
            alt="Print Queen 3D Hero"
            className="w-full h-auto object-contain transition-opacity duration-1000"
            style={{ maxHeight: '350px' }}
          />
          
          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBannerIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentBannerIndex 
                    ? 'bg-white shadow-lg' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Banner - Static */}
        <div className="block md:hidden relative w-full">
          <img
            src="https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/7969hqqc_mobilebanner.png"
            alt="Print Queen 3D Mobile Banner"
            className="w-full h-auto object-contain"
          />
        </div>
      </section>

      {/* Shop Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Payment Stands', link: '/nfc-stand', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/1x9anwex_Payment%20Stands.JPEG' },
              { name: 'Keychains', link: '/products', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/lv917wjw_Keychains.JPEG' },
              { name: 'Home Decor', link: '/products', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/qet0lf5s_Home%20Decor.JPEG' },
              { name: 'Incense Holders', link: '/products', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/00hi9ssm_Insense%20Holder.JPEG' },
              { name: 'Toys & Fidgets', link: '/products', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/tnhixlyx_Toys%20and%20Fidgets.JPEG' },
              { name: 'Custom 3D Prints', link: '/products', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/j7ob4q4t_Custom%203d%20Prints.JPEG' }
            ].map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 text-center border-t border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-900">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Featured Products</h2>
            <p className="text-lg text-gray-600">Handpicked favorites from our collection</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { name: 'Custom NFC Stand', price: 45.00, image: 'https://printqueen3d-storefront1.vercel.app/paymentstands.PNG', badge: 'Customizable' },
              { name: 'NFC Keychain Set', price: 24.99, image: 'https://printqueen3d-storefront1.vercel.app/nfckeychain.png', badge: 'Popular' },
              { name: 'Geometric Planter', price: 34.99, image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400', badge: 'New' },
              { name: 'Desk Organizer', price: 29.99, image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400', badge: 'Trending' }
            ].map((product, index) => (
              <Link
                key={index}
                to={product.name === 'Custom NFC Stand' ? '/nfc-stand' : '/products'}
                className="group product-card rounded-xl overflow-hidden hover:scale-105 transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {product.badge && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {product.badge}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/products">
              <button className="btn-primary text-lg px-8 py-4">
                Shop All Products
              </button>
            </Link>
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
          {/* Brand Section */}
          <div className="footer-section">
            <img 
              src="/printqueen-logo.png" 
              alt="Print Queen 3D" 
              className="h-16 w-auto mb-4"
            />
            <p className="text-gray-300 font-semibold mb-2">
              Precision in Every Layer. Style in Every Print.<br />
              Built in LA. Made for Everywhere.<br />
              If You Can Dream It, We Can Print It.
            </p>
            <p className="text-gray-400 text-sm mb-4">
              <strong>Local Pickup Available In These Cities:</strong><br />
              Los Angeles, Altadena, Long Beach, Hawthorne, West Covina<br />
              <strong>Shipping Everywhere</strong>
            </p>
            <p className="text-gray-300">
              <a href="tel:8004956227" className="hover:text-blue-400">800-495-6227</a><br />
              <a href="mailto:Printqueen3d@gmail.com" className="hover:text-blue-400">Printqueen3d@gmail.com</a>
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">About Us</Link></li>
              <li><Link to="/products">Shop Products</Link></li>
              <li><Link to="/nfc-stand">Request a Quote</Link></li>
              {user && <li><Link to="/orders">My Account</Link></li>}
            </ul>
          </div>

          {/* Connect & Collaborate */}
          <div className="footer-section">
            <h3>Connect & Collaborate</h3>
            <ul className="footer-links">
              <li><a href="mailto:Printqueen3d@gmail.com">Partner With Us</a></li>
              <li><a href="#">Product Care</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Refund Policy</a></li>
              <li><a href="#">Shipping Policy</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 Print Queen 3D. All rights reserved.</p>
          <p className="text-sm text-gray-400 mt-2">Made to order in Los Angeles · Fast, reliable shipping · Local pickup available</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;