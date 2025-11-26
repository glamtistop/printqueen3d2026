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

  // Get hero images from config or use defaults
  const heroImages = siteConfig?.settings?.hero_images;
  const desktopHeroImages = heroImages?.desktop_images?.length > 0 
    ? heroImages.desktop_images 
    : bannerImages;
  const mobileHeroImage = heroImages?.mobile_image || bannerImages[0];

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % desktopHeroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [desktopHeroImages.length]);

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
          style={{ y: heroY, opacity: heroOpacity, height: '550px' }}
          className="hidden md:block relative w-full"
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
            Print Queen 3D turns creativity into tangible design. We specialize in premium, made-to-order 3D prints—NFC payment stands, QR displays, personalized keychains and charms, lithophane lamps, vases, fidgets, and custom pieces for events and brands. Every item is printed locally in LA with quality materials, then checked by hand for a clean, professional finish. Whether you are a business that needs smart, on-brand tools or you are gifting something one-of-a-kind, we deliver fast, friendly service and precision results. Your ideas deserve to be printed perfectly.
          </p>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section">
            <img 
              src={settings.logo_url || "/printqueen-logo.png"} 
              alt={settings.site_name || "Print Queen 3D"} 
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
              {contactInfo.phone && (
                <><a href={`tel:${contactInfo.phone}`} className="hover:text-blue-400">{contactInfo.phone}</a><br /></>
              )}
              {!contactInfo.phone && (
                <><a href="tel:8004956227" className="hover:text-blue-400">800-495-6227</a><br /></>
              )}
              {contactInfo.email && (
                <a href={`mailto:${contactInfo.email}`} className="hover:text-blue-400">{contactInfo.email}</a>
              )}
              {!contactInfo.email && (
                <a href="mailto:Printqueen3d@gmail.com" className="hover:text-blue-400">Printqueen3d@gmail.com</a>
              )}
            </p>
            {/* Social Links */}
            {(socialLinks.instagram || socialLinks.facebook || socialLinks.twitter || socialLinks.youtube) && (
              <div className="flex gap-4 mt-4">
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-400 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
              </div>
            )}
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
          <p>© 2025 {settings.site_name || 'Print Queen 3D'}. {settings.footer_text || 'All rights reserved.'}</p>
          <p className="text-sm text-gray-400 mt-2">Made to order in Los Angeles · Fast, reliable shipping · Local pickup available</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
