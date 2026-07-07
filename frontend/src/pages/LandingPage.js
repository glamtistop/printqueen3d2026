import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Instagram, MapPin, ShieldCheck, Sparkles, Star, Truck, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';
import MockProductVisual from '../components/MockProductVisual';
import { Skeleton } from '../components/ui/skeleton';

const fallbackHeroImage = '/assets/homepage/printqueen-hero-realistic-products.png';
const fallbackProjectImages = [
  '/assets/homepage/printqueen-hero-realistic-products.png',
  '/assets/homepage/printqueen-hero-products.png',
  '/assets/homepage/payment-stands.png',
  '/assets/homepage/nfc-keychain.png',
  '/assets/homepage/category-keychains.jpg',
  '/assets/homepage/category-home-decor.jpg',
  '/assets/homepage/category-custom-3d-prints.jpg',
];

const legacyHeroImages = new Set([
  '/assets/homepage/custom-3d-prints.png',
  '/assets/homepage/payment-stands.png',
  '/assets/homepage/nfc-keychain.png',
  '/assets/homepage/printqueen-hero-products.png'
]);

const collectionDisplayOrder = [
  'Personalized Favorites',
  'Business Solutions',
  'Keychains & Charms',
  'Gifts & Keepsakes',
  'Home Decor & Lithophanes',
  'Home Décor & Lithophanes',
  'Fidgets & Fun',
  'Celebrations & Special Occasions',
  'Design Your Own',
];

const trustCards = [
  [Sparkles, 'Personalized for Every Customer', 'Every piece can be customized with names, colors, photos, logos, QR codes, NFC chips, or custom design details.'],
  [Truck, 'Production Time: 3-5 Days', 'Production typically takes 3-5 days after design approval, depending on project size and complexity.'],
  [ShieldCheck, 'Expert Finishing', 'Each piece is cleaned, refined, and quality checked for a polished final result.'],
  [MapPin, 'Designed & Printed in Los Angeles', 'Locally made in Los Angeles with nationwide U.S. shipping and select local pickup options.'],
];

const renderRouteLink = (to, className, children) => {
  const link = to || '#';
  return link.startsWith('#') || link.startsWith('http') ? (
    <a href={link} className={className}>{children}</a>
  ) : (
    <Link to={link} className={className}>{children}</Link>
  );
};

const LandingPage = () => {
  const [siteConfig, setSiteConfig] = useState(null);
  const [collections, setCollections] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, review: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const [siteResponse, collectionsResponse, featuredResponse, reviewsResponse] = await Promise.all([
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`, { cache: 'no-store' }),
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/collections`),
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/products/featured/list?limit=12`),
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reviews`)
        ]);
        setSiteConfig(await siteResponse.json());
        setCollections(await collectionsResponse.json());
        setFeaturedProducts(await featuredResponse.json());
        setFeaturedReviews(await reviewsResponse.json());
      } catch (error) {
        console.error('Failed to load homepage data:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchPageData();
  }, []);

  const settings = siteConfig?.settings || {};
  const heroImages = settings.hero_images || {};
  const savedDesktopHeroImages = Array.isArray(heroImages.desktop_images)
    ? heroImages.desktop_images.filter((image) => image && !legacyHeroImages.has(image))
    : [];
  const desktopHeroImage = savedDesktopHeroImages[0] || '';
  const mobileHeroImage = heroImages.mobile_image || desktopHeroImage;
  const hasHeroImage = Boolean(desktopHeroImage || mobileHeroImage);

  const getSection = (sectionId) => siteConfig?.homepage_sections?.find((section) => section.id === sectionId);
  const isSectionEnabled = (sectionId) => {
    const section = getSection(sectionId);
    return section ? section.enabled : true;
  };
  const getSectionContent = (sectionId, field, defaultValue = '') => {
    const section = getSection(sectionId);
    return section?.content?.[field] ?? defaultValue;
  };

  const getCollectionImage = (collection) => (
    collection.image_url || collection.cover_image_url || collection.image || ''
  );

  const getHomepageCollectionLink = (collection) => {
    const collectionName = (collection.name || '').trim().toLowerCase();
    if (collectionName.includes('design your own')) {
      return '/design-your-own';
    }
    return `/shop?collection=${encodeURIComponent(collection.id)}`;
  };

  const homepageCollections = (() => {
    const normalizedCollections = collections.map((collection) => ({
      ...collection,
      normalizedName: (collection.name || '').trim().toLowerCase()
    }));
    const seen = new Set();
    const orderedCollections = collectionDisplayOrder
      .map((name) => normalizedCollections.find((collection) => collection.normalizedName === name.toLowerCase()))
      .filter(Boolean)
      .filter((collection) => {
        if (seen.has(collection.id)) return false;
        seen.add(collection.id);
        return true;
      });
    return (orderedCollections.length > 0 ? orderedCollections : normalizedCollections).slice(0, 6);
  })();

  const heroContent = getSection('hero')?.content || {};
  const heroHeadline = !heroContent.headline || heroContent.headline === 'Custom 3D Printed Creations' || heroContent.headline === 'Custom 3D Creations Made Just for You'
    ? 'Create Something Uniquely Yours'
    : heroContent.headline;
  const heroSubheadline = !heroContent.subheadline
    || heroContent.subheadline === 'Bringing Your Ideas to Life'
    || /premium materials/i.test(heroContent.subheadline || '')
    ? 'Professionally 3D printed custom creations for personalized gifts, business branding, NFC products, home decor, keepsakes, and one-of-a-kind designs.'
    : heroContent.subheadline;
  const hasEditableHeroBadge = Object.prototype.hasOwnProperty.call(heroContent, 'badge_label');
  const rawHeroBadge = hasEditableHeroBadge ? heroContent.badge_label : heroContent.description;
  const heroBadge = !hasEditableHeroBadge && (
    !rawHeroBadge
    || rawHeroBadge === 'Discover unique 3D printed products crafted with precision and care.'
    || rawHeroBadge === 'Custom 3D Creation Studio'
  )
    ? 'CUSTOM 3D CREATION STUDIO'
    : rawHeroBadge;
  const heroPrimaryText = !heroContent.button_text || heroContent.button_text === 'Shop Now' ? 'Start Custom Order' : heroContent.button_text;
  const heroPrimaryLink = !heroContent.button_link || heroContent.button_link === '/products' || heroContent.button_link === '#design-your-own' ? '/design-your-own' : heroContent.button_link;
  const heroSecondaryText = heroContent.secondary_button_text || 'Shop Collections';
  const heroSecondaryLink = heroContent.secondary_button_link || '#collections';
  const heroOverlayOpacity = heroContent.overlay_opacity ?? 0.58;
  const heroOverlayColor = heroContent.overlay_color || '#d8ecdd';
  const heroHeightDesktop = Number(heroContent.hero_height_desktop) || 640;
  const heroHeightMobile = Number(heroContent.hero_height_mobile) || 560;
  const heroImagePosition = heroContent.hero_image_position || 'center right';

  const marqueeContent = getSection('marquee')?.content || {};
  const savedMarqueeMessages = Array.isArray(marqueeContent.marquee_messages) ? marqueeContent.marquee_messages.filter(Boolean) : [];
  const marqueeMessages = savedMarqueeMessages;
  const marqueeImages = Array.isArray(marqueeContent.marquee_images) ? marqueeContent.marquee_images.filter(Boolean) : [];
  const marqueeShowImages = marqueeContent.marquee_show_images && marqueeImages.length > 0;
  const shouldShowMarquee = isSectionEnabled('marquee') && (marqueeMessages.length > 0 || marqueeShowImages);
  const marqueeSpeed = marqueeContent.marquee_speed || 30;
  const marqueeDirection = marqueeContent.marquee_direction === 'right' ? 'reverse' : 'normal';
  const marqueeGap = marqueeContent.marquee_gap || 32;
  const marqueeBackgroundStyle = {
    backgroundColor: marqueeContent.marquee_background_color || undefined,
    backgroundImage: marqueeContent.marquee_background_image_url ? `url(${marqueeContent.marquee_background_image_url})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    paddingTop: `${marqueeContent.marquee_padding_y || 12}px`,
    paddingBottom: `${marqueeContent.marquee_padding_y || 12}px`,
  };

  const isCustomProduct = (product) => {
    const customTerms = ['custom', 'personal', 'name', 'nfc', 'lithophane', 'photo', 'qr', 'keychain', 'logo', 'wedding', 'memorial'];
    const text = `${product?.name || ''} ${product?.category || ''} ${product?.description || ''}`.toLowerCase();
    return Boolean(product?.is_custom || product?.custom_builder || customTerms.some((term) => text.includes(term)));
  };

  const getProductBadges = (product) => {
    const badges = [];
    if (product?.badge && product.sale_badge_enabled !== false) badges.push(product.badge);
    const text = `${product?.name || ''} ${product?.category || ''} ${product?.description || ''}`.toLowerCase();
    if (product?.featured) badges.push('Best Seller');
    if (isCustomProduct(product)) badges.push('Customizable');
    if (text.includes('personal') || text.includes('name')) badges.push('Personalized');
    if (text.includes('nfc')) badges.push('NFC Enabled');
    if (product?.is_new || text.includes('new')) badges.push('New');
    return [...new Set(badges)].slice(0, 3);
  };

  const formatPrice = (price, prefix = '') => {
    const amount = Number(price || 0).toFixed(2);
    return `${prefix ? `${prefix} ` : ''}$${amount}`;
  };

  const renderProductPrice = (product) => {
    const hasComparePrice = Number(product?.compare_at_price) > Number(product?.price || 0);
    return (
      <div className="flex flex-col items-center sm:items-start leading-tight">
        {hasComparePrice && (
          <span className="text-sm font-semibold text-gray-400 line-through">
            {formatPrice(product.compare_at_price, product.compare_at_price_prefix)}
          </span>
        )}
        <span className="text-2xl font-bold text-green-600">
          {formatPrice(product.price, product.price_prefix || (product.custom_builder ? 'Starting at' : ''))}
        </span>
      </div>
    );
  };

  const bestSellerLimit = Number(getSectionContent('featured', 'product_limit', 8)) || 8;
  const bestSellerProducts = featuredProducts.slice(0, Math.min(bestSellerLimit, 12));
  const aboutContent = getSection('about_preview')?.content || {};
  const aboutImageSetting = aboutContent.image_url || '';
  const aboutMobileImage = aboutContent.mobile_image_url || aboutImageSetting;
  const aboutImagePosition = aboutContent.image_position || 'center';
  const aboutImageAlt = aboutContent.image_alt || 'Print Queen 3D custom creations';
  const aboutSectionPadding = Number(aboutContent.section_padding_y) || 64;
  const aboutBackgroundColor = aboutContent.background_color || '#ffffff';
  const aboutTextSizeClass = aboutContent.text_size === 'sm' ? 'text-base' : aboutContent.text_size === 'xl' ? 'text-xl' : 'text-lg';
  const aboutButtonClass = aboutContent.button_size === 'large' ? 'inline-flex mt-7 btn-primary text-lg px-8 py-4' : 'inline-flex mt-7 btn-primary';
  const ctaBackgroundSetting = getSectionContent('design_cta', 'background_image_url', fallbackHeroImage);
  const aboutImage = legacyHeroImages.has(aboutImageSetting) ? '' : aboutImageSetting;
  const ctaBackground = legacyHeroImages.has(ctaBackgroundSetting) ? fallbackHeroImage : ctaBackgroundSetting;

  const trustCardIcons = [Sparkles, Truck, ShieldCheck, MapPin];
  const savedInfoCards = getSection('why_choose_us')?.content?.info_cards;
  const whyChooseCards = Array.isArray(savedInfoCards) && savedInfoCards.filter((card) => card?.title).length > 0
    ? savedInfoCards.filter((card) => card?.title).map((card, index) => ({
        Icon: trustCardIcons[index % trustCardIcons.length],
        title: card.title,
        text: card.text || ''
      }))
    : trustCards.map(([Icon, title, text]) => ({ Icon, title, text }));
  const howItWorksSteps = (getSection('how_it_works')?.content?.steps || []).filter((step) => step?.title);
  const faqItems = (getSection('faq')?.content?.faq_items || []).filter((item) => item?.question);

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewSubmitting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      if (!response.ok) throw new Error('Review submission failed');
      setReviewForm({ name: '', rating: 5, review: '' });
      toast.success('Thank you! Your review was submitted for approval.');
    } catch (error) {
      toast.error('We could not submit your review yet.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {shouldShowMarquee && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600" style={marqueeBackgroundStyle}>
          <div
            className="animate-marquee whitespace-nowrap inline-flex items-center font-semibold text-sm md:text-base tracking-wide"
            style={{ animationDuration: `${marqueeSpeed}s`, animationDirection: marqueeDirection, gap: `${marqueeGap}px`, color: marqueeContent.marquee_text_color || '#ffffff' }}
          >
            {[...Array(3)].flatMap(() => marqueeMessages).map((message, index) => (
              <span key={`${message}-${index}`} className="inline-flex items-center" style={{ gap: `${marqueeGap}px` }}>
                {marqueeShowImages && marqueeImages[index % marqueeImages.length] && (
                  <img src={marqueeImages[index % marqueeImages.length]} alt="" className="h-10 w-10 rounded-full object-cover border border-white/40" />
                )}
                <span>{message}</span>
                <span className="opacity-70">•</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <Navbar />

      {isSectionEnabled('hero') && (
      <section className="relative isolate w-full overflow-hidden" style={{ backgroundColor: heroOverlayColor || '#d8ecdd' }}>
        {hasHeroImage && (
          <div className="absolute inset-0 z-0">
            <picture>
              {mobileHeroImage && <source media="(max-width: 767px)" srcSet={mobileHeroImage} />}
              <img
                src={desktopHeroImage || mobileHeroImage}
                alt="Custom 3D creations by Print Queen 3D"
                className="h-full w-full object-cover md:object-contain md:object-right"
                style={{ objectPosition: heroImagePosition }}
              />
            </picture>
          </div>
        )}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: hasHeroImage
              ? `linear-gradient(90deg, ${heroOverlayColor} 0%, ${heroOverlayColor} 55%, transparent 100%)`
              : `linear-gradient(135deg, ${heroOverlayColor} 0%, #eef8f2 52%, #ffffff 100%)`,
            opacity: hasHeroImage ? heroOverlayOpacity : 1
          }}
        />
        <div
          className="relative z-10 hero-shell-height flex items-center"
          style={{ '--hero-height-mobile': `${heroHeightMobile}px`, '--hero-height-desktop': `${heroHeightDesktop}px` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
            <div className="max-w-2xl mx-auto md:mx-0 text-center md:text-left">
              {heroBadge?.trim() && <span className="hero-badge">{heroBadge}</span>}
              <h1 className="hero-title text-5xl sm:text-6xl md:text-7xl">{heroHeadline}</h1>
              <p className="hero-subtitle max-w-xl">{heroSubheadline}</p>
              <div className="hero-buttons justify-center md:justify-start">
                {renderRouteLink(heroPrimaryLink, 'btn-primary text-center', heroPrimaryText)}
                {renderRouteLink(heroSecondaryLink, 'btn-secondary text-center', heroSecondaryText)}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {isSectionEnabled('categories') && (
        <motion.section
          id="collections"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="py-16 bg-white scroll-mt-28"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {homepageCollections.map((collection) => {
                const collectionImage = getCollectionImage(collection);
                const isDesignYourOwn = (collection.name || '').trim().toLowerCase().includes('design your own');
                return (
                  <a key={collection.id} href={getHomepageCollectionLink(collection)} className="group product-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                      {collectionImage ? (
                        <img src={collectionImage} alt={collection.image_alt || collection.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <MockProductVisual label={collection.name} className="group-hover:scale-105 transition-transform duration-300" />
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{collection.name}</h3>
                      {collection.description && <p className="text-sm text-gray-600 min-h-[60px] line-clamp-3">{collection.description}</p>}
                      <div className="flex items-center justify-center sm:justify-end gap-3 mt-5">
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold group-hover:bg-blue-700 transition-colors">
                          {isDesignYourOwn
                            ? getSectionContent('categories', 'secondary_button_text', 'Start Custom Project')
                            : getSectionContent('categories', 'button_text', 'Personalize Yours')}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {isSectionEnabled('featured') && (
        <section className="py-16 bg-gradient-to-b from-blue-50/60 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="section-title">{['Featured Products'].includes(getSectionContent('featured', 'headline', '')) ? 'Best Sellers' : getSectionContent('featured', 'headline', 'Best Sellers')}</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                {['Our most popular items'].includes(getSectionContent('featured', 'subheadline', '')) ? 'Customer favorites made to personalize, gift, and use every day.' : getSectionContent('featured', 'subheadline', 'Customer favorites made to personalize, gift, and use every day.')}
              </p>
            </div>
            {loadingProducts ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-80 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestSellerProducts.map((product) => {
                  const badges = getProductBadges(product);
                  return (
                    <Link key={product.id} to={`/products/${product.id}`} className="group product-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.image_alt || product.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <MockProductVisual label={product.name} className="group-hover:scale-105 transition-transform duration-300" />
                        )}
                        {badges.length > 0 && (
                          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                            {badges.map((badge) => (
                              <span
                                key={badge}
                                className="bg-white/95 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                                style={badge === product.badge ? { backgroundColor: product.badge_color || '#dc2626', color: '#ffffff' } : undefined}
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                        {product.subtitle && <p className="text-sm font-bold text-blue-700">{product.subtitle}</p>}
                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 mt-5">
                          {renderProductPrice(product)}
                          <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold group-hover:bg-blue-700 transition-colors">
                            {getSectionContent('featured', 'button_text', 'Customize Now')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {isSectionEnabled('why_choose_us') && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="section-title text-center mb-10">{['Why Choose Print Queen 3D?'].includes(getSectionContent('why_choose_us', 'headline', '')) ? 'Why Print Queen 3D' : getSectionContent('why_choose_us', 'headline', 'Why Print Queen 3D')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {whyChooseCards.map(({ Icon, title, text }, index) => (
                <div key={title || index} className="rounded-xl bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100 p-6 shadow-sm text-center">
                  <Icon className="h-8 w-8 text-blue-600 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isSectionEnabled('how_it_works') && howItWorksSteps.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50/60">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="section-title">{getSectionContent('how_it_works', 'headline', 'How It Works')}</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                {getSectionContent('how_it_works', 'subheadline', 'Custom orders made easy, from idea to finished print in four simple steps.')}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {howItWorksSteps.map((step, index) => (
                <div key={step.title || index} className="rounded-xl bg-white border border-blue-100 p-6 shadow-sm text-center">
                  <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold">{index + 1}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
            {getSectionContent('how_it_works', 'button_text', 'Start My Custom Order') && (
              <div className="text-center mt-10">
                {renderRouteLink(
                  getSectionContent('how_it_works', 'button_link', '/design-your-own'),
                  'btn-primary inline-flex',
                  getSectionContent('how_it_works', 'button_text', 'Start My Custom Order')
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {isSectionEnabled('design_cta') && (
        <section className="relative isolate overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 z-0">
            <img src={ctaBackground} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700/90 via-emerald-600/80 to-blue-900/75" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-5">{getSectionContent('design_cta', 'headline', 'Have an idea? We’ll bring it to life.')}</h2>
            <p className="text-lg md:text-xl leading-relaxed opacity-95 max-w-3xl mx-auto">
              {getSectionContent('design_cta', 'description', 'Start your custom order by sharing your idea, inspiration photos, logo, sketch, or reference details. We’ll review your project and help create something made just for you.')}
            </p>
            {renderRouteLink(
              getSectionContent('design_cta', 'button_link', '/custom-order'),
              'inline-flex mt-8 bg-white text-blue-700 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors',
              getSectionContent('design_cta', 'button_text', 'Start My Custom Project')
            )}
          </div>
        </section>
      )}

      {isSectionEnabled('about_preview') && (
        <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: `${aboutSectionPadding}px`, paddingBottom: `${aboutSectionPadding}px`, backgroundColor: aboutBackgroundColor }}>
          <div className={`max-w-7xl mx-auto grid ${aboutImage ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-10 items-center`}>
            {aboutImage && (
              <div className="overflow-hidden rounded-xl bg-blue-50 border border-blue-100 aspect-[4/3]">
                <picture>
                  {aboutMobileImage && <source media="(max-width: 767px)" srcSet={aboutMobileImage} />}
                  <img src={aboutImage} alt={aboutImageAlt} className="h-full w-full object-cover" style={{ objectPosition: aboutImagePosition }} />
                </picture>
              </div>
            )}
            <div className="text-center lg:text-left">
              <h2 className="section-title mb-5">{getSectionContent('about_preview', 'headline', 'About Print Queen 3D')}</h2>
              <div className={`${aboutTextSizeClass} text-gray-600 leading-relaxed space-y-4`}>
                {getSectionContent('about_preview', 'description', 'Print Queen 3D is a small business built on creativity, precision, and the love of bringing ideas to life. As a small business owner, I take pride in creating custom 3D-printed products that feel personal, polished, and made just for you.\n\nFrom personalized gifts and keepsakes to NFC products, business branding, home décor, lithophanes, keychains, pendants, and one-of-a-kind designs, every piece is professionally 3D printed with care, precision, and expert finishing. Whether you have a finished design, a photo, a logo, or just an idea, I’ll work with you to help turn your vision into something real.').split('\n').filter(Boolean).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {renderRouteLink(
                getSectionContent('about_preview', 'button_link', '/about'),
                aboutButtonClass,
                getSectionContent('about_preview', 'button_text', 'Learn More')
              )}
            </div>
          </div>
        </section>
      )}

      {isSectionEnabled('reviews') && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/70 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="section-title">{getSectionContent('reviews', 'headline', 'What Customers Are Saying')}</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                {getSectionContent('reviews', 'subheadline', 'Real custom creations deserve real reactions.')}
              </p>
            </div>
            {featuredReviews.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {featuredReviews.slice(0, 4).map((review) => (
                  <div key={review.id} className="rounded-xl bg-white border border-blue-100 p-6 shadow-sm">
                    <div className="flex justify-center gap-1 text-yellow-400 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-5">“{review.review}”</p>
                    <p className="font-bold text-gray-900">{review.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-blue-100 p-6 text-center text-gray-600">
                Featured customer reviews will appear here soon.
              </div>
            )}

            <form onSubmit={submitReview} className="mt-10 max-w-3xl mx-auto rounded-xl bg-white border border-blue-100 shadow-sm p-5 md:p-7">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Leave a Review</h3>
                <p className="text-gray-600 mt-2">Share your experience with Print Queen 3D.</p>
              </div>
              <div className="grid md:grid-cols-[1fr_auto] gap-4 mb-4">
                <input
                  required
                  value={reviewForm.name}
                  onChange={(event) => setReviewForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-4 py-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm((current) => ({ ...current, rating }))}
                      className="text-yellow-400"
                      aria-label={`${rating} star rating`}
                    >
                      <Star className={`h-6 w-6 ${rating <= reviewForm.rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                required
                rows="4"
                value={reviewForm.review}
                onChange={(event) => setReviewForm((current) => ({ ...current, review: event.target.value }))}
                placeholder="Write your review"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button type="submit" disabled={reviewSubmitting} className="w-full btn-primary text-lg py-4 mt-4 disabled:opacity-70">
                {reviewSubmitting ? 'Submitting Review...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </section>
      )}

      {isSectionEnabled('faq') && faqItems.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="section-title">{getSectionContent('faq', 'headline', 'Frequently Asked Questions')}</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
                {getSectionContent('faq', 'subheadline', 'Quick answers about custom orders, turnaround, shipping, and pickup.')}
              </p>
            </div>
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <details key={item.question || index} className="group rounded-xl border border-blue-100 bg-white shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-bold text-gray-900 [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <span aria-hidden="true" className="text-2xl leading-none text-blue-600 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-gray-600 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
            {getSectionContent('faq', 'button_text', 'Still have questions? Contact us') && (
              <div className="text-center mt-10">
                {renderRouteLink(
                  getSectionContent('faq', 'button_link', '/contact'),
                  'btn-secondary inline-flex',
                  getSectionContent('faq', 'button_text', 'Still have questions? Contact us')
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {isSectionEnabled('social_gallery') && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <Camera className="h-10 w-10 mx-auto text-blue-600 mb-4" />
              <h2 className="section-title">{getSectionContent('social_gallery', 'headline', 'Follow Our Latest Creations')}</h2>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <a href={settings.social_links?.instagram || 'https://instagram.com/printqueen3d'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-700 font-bold hover:text-blue-900">
                  <Instagram className="h-5 w-5" /> {settings.footer_instagram_label?.replace('Instagram: ', '') || '@printqueen3d'}
                </a>
                <a href={settings.social_links?.tiktok || 'https://www.tiktok.com/@printqueen3d'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-700 font-bold hover:text-blue-900">
                  <Wand2 className="h-5 w-5" /> {settings.footer_tiktok_label?.replace('TikTok: ', '') || '@printqueen3d'}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      <SiteFooter siteConfig={siteConfig} />
    </div>
  );
};

export default LandingPage;
