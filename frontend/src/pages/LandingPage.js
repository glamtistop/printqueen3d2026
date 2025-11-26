import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Skeleton } from '../components/ui/skeleton';

const LandingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [siteConfig, setSiteConfig] = useState(null);

  // Parallax Scroll Hook
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  const bannerImages = [
    'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/3gxh6aog_custom3dprints.PNG',
    'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/gzhz9uee_paymentstands.PNG',
    'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/cmhra1j0_nfckeychain.png'
  ];

  // Fetch site configuration
  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`);
        const data = await response.json();
        setSiteConfig(data);
      } catch (error) {
        console.error('Failed to fetch site config:', error);
      }
    };
    fetchSiteConfig();
  }, []);

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/products/featured/list?limit=6`);
        const data = await response.json();
        setFeaturedProducts(data);
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    alert(`Thanks for joining! Check ${email} for your 10% off code.`);
    setEmail('');
  };

  // Helper to check if a section is enabled
  const isSectionEnabled = (sectionId) => {
    if (!siteConfig?.homepage_sections) return true;
    const section = siteConfig.homepage_sections.find(s => s.id === sectionId);
    return section ? section.enabled : true;
  };

  // Helper to get section content
  const getSectionContent = (sectionId, field, defaultValue = '') => {
    if (!siteConfig?.homepage_sections) return defaultValue;
    const section = siteConfig.homepage_sections.find(s => s.id === sectionId);
    return section?.content?.[field] || defaultValue;
  };

  // Get site settings
  const settings = siteConfig?.settings || {};
  const contactInfo = settings.contact_info || {};
  const socialLinks = settings.social_links || {};

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Banner - Auto-rotating Carousel (Desktop) / Static Banner (Mobile) */}
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: '#d8ecdd' }}>
        {/* Desktop Banner - Carousel with Parallax */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="hidden md:block relative w-full" 
          style={{ height: '550px' }}
        >
          {/* Main Banner Image */}
          <div className="relative flex items-center justify-center h-full">
            <img
              src={bannerImages[currentBannerIndex]}
              alt="Print Queen 3D Hero"
              className="h-full w-auto object-contain transition-opacity duration-1000"
            />
          </div>
          
          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
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
        </motion.div>

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
      {isSectionEnabled('categories') && (
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-12 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Payment Stands', link: '/products?category=Payment Stands', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/1x9anwex_Payment%20Stands.JPEG' },
              { name: 'Keychains', link: '/products?category=Keychains', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/lv917wjw_Keychains.JPEG' },
              { name: 'Home Decor', link: '/products?category=Home Decor', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/qet0lf5s_Home%20Decor.JPEG' },
              { name: 'Incense Holders', link: '/products?category=Incense Holders', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/00hi9ssm_Insense%20Holder.JPEG' },
              { name: 'Toys & Fidgets', link: '/products?category=Toys & Fidgets', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/tnhixlyx_Toys%20and%20Fidgets.JPEG' },
              { name: 'Custom 3D Prints', link: '/products?category=Custom 3D Prints', image: 'https://customer-assets.emergentagent.com/job_inspiring-curie/artifacts/j7ob4q4t_Custom%203d%20Prints.JPEG' }
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
      </motion.section>
      )}

      {/* Featured Products */}
      {isSectionEnabled('featured') && (
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="py-16 bg-gradient-to-b from-white to-blue-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              {getSectionContent('featured', 'headline', 'Featured Products')}
            </h2>
            <p className="text-lg text-gray-600">
              {getSectionContent('featured', 'subheadline', 'Handpicked favorites from our collection')}
            </p>
          </div>
          
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No featured products available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group product-card rounded-xl overflow-hidden hover:scale-105 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                    <img
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400'}
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
          )}

          <div className="text-center mt-10">
            <Link to="/products">
              <button className="btn-primary text-lg px-8 py-4">
                Shop All Products
              </button>
            </Link>
          </div>
        </div>
      </motion.section>
      )}

      {/* Why Choose Section */}
      {isSectionEnabled('why_choose_us') && (
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center mb-16">
            {getSectionContent('why_choose_us', 'headline', 'Why Choose Print Queen 3D?')}
          </h2>
          
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
      </motion.section>
      )}

      {/* Newsletter Section */}
      {isSectionEnabled('newsletter') && (
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-green-600"
      >
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            {getSectionContent('newsletter', 'headline', 'Want 10% off?')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {getSectionContent('newsletter', 'description', 'Join the royal list for new drops, exclusive offers, and a 10% welcome coupon. We send good vibes only.')}
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
              {getSectionContent('newsletter', 'button_text', 'Get my 10%')}
            </button>
          </form>
        </div>
      </motion.section>
      )}

      {/* About Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center mb-8">Your Vision, Printed Perfectly.</h2>
          <p className="text-lg text-gray-600 leading-relaxed text-center">
            Print Queen 3D turns creativity into tangible design. We specialize in premium, made-to-order 3D prints—NFC payment stands, QR displays, personalized keychains and charms, lithophane lamps, vases, fidgets, and custom pieces for events and brands. Every item is printed locally in LA with quality materials, then checked by hand for a clean, professional finish. Whether you're a business that needs smart, on-brand tools or you're gifting something one-of-a-kind, we deliver fast, friendly service and precision results. Your ideas deserve to be printed perfectly.
          </p>
        </div>
      </motion.section>

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
              <li><Link to="/products/nfc-stand-custom">Request a Quote</Link></li>
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
