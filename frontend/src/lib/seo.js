const SITE_URL = 'https://www.printqueen3d.com';
const DEFAULT_TITLE = 'Custom 3D Printing & Personalized Gifts | Print Queen 3D';
const DEFAULT_DESCRIPTION = 'Custom 3D printed gifts, NFC products, home décor & keepsakes made to order in Los Angeles. Add names, photos, colors & logos. Ships across the U.S.';

const upsertMeta = (attr, key, content) => {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertCanonical = (url) => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
};

export const setPageMeta = ({ title, description, path } = {}) => {
  const fullTitle = title || DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${SITE_URL}${path ?? window.location.pathname}`;

  document.title = fullTitle;
  upsertMeta('name', 'description', metaDescription);
  upsertMeta('property', 'og:title', fullTitle);
  upsertMeta('property', 'og:description', metaDescription);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertCanonical(canonicalUrl);
};

export const setProductJsonLd = (product) => {
  removeProductJsonLd();
  if (!product) return;
  const image = product.images?.[0] || '';
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: (product.description || '').slice(0, 300),
    image: absoluteImage ? [absoluteImage] : undefined,
    brand: { '@type': 'Brand', name: 'Print Queen 3D' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: 'USD',
      price: Number(product.price || 0).toFixed(2),
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Print Queen 3D' }
    }
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'product-jsonld';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

export const removeProductJsonLd = () => {
  document.getElementById('product-jsonld')?.remove();
};

// Titles and descriptions for every static route.
export const ROUTE_META = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION
  },
  '/shop': {
    title: 'Shop Custom 3D Printed Gifts, Keychains & NFC Products',
    description: 'Browse made-to-order 3D prints: personalized keychains, NFC stands, photo lights, décor, toys & gifts for every occasion. Made in Los Angeles.'
  },
  '/products': {
    title: 'Shop Custom 3D Printed Gifts, Keychains & NFC Products',
    description: 'Browse made-to-order 3D prints: personalized keychains, NFC stands, photo lights, décor, toys & gifts for every occasion. Made in Los Angeles.'
  },
  '/design-your-own': {
    title: 'Custom 3D Print Orders Made Easy | Print Queen 3D',
    description: "Send your idea, photo, logo, or sketch and we'll 3D print it. Free quotes, 3-5 day production, shipping or free LA pickup. No design skills needed."
  },
  '/custom-order': {
    title: 'Custom 3D Print Orders Made Easy | Print Queen 3D',
    description: "Send your idea, photo, logo, or sketch and we'll 3D print it. Free quotes, 3-5 day production, shipping or free LA pickup. No design skills needed."
  },
  '/personalize': {
    title: 'Personalized 3D Printed Gifts for Every Occasion',
    description: 'Personalized keychains, keepsakes, décor, and gifts made just for you. Add names, photos, colors & logos. Custom 3D printed in Los Angeles.'
  },
  '/corporate-bulk-orders': {
    title: 'Custom Branded Products – NFC Stands, Logo Gifts & Bulk',
    description: 'Branded 3D printed products for business: NFC stands, logo keychains, displays & promo items. Bulk pricing for events, teams & storefronts.'
  },
  '/about': {
    title: 'About Print Queen 3D – Los Angeles Custom 3D Printing',
    description: 'Meet the LA small business behind Print Queen 3D. Personalized 3D printed gifts, NFC products & custom creations, designed and finished by hand.'
  },
  '/contact': {
    title: 'Contact Print Queen 3D – Custom 3D Printing in LA',
    description: 'Questions about a custom 3D print? Contact Print Queen 3D in Los Angeles for quotes, custom orders, bulk pricing & collaborations. Fast replies.'
  },
  '/materials': {
    title: 'Materials & 3D Printing Process | Print Queen 3D',
    description: 'Learn how your custom order is made: quality PLA & PETG filament, resin finishes, and expert hand-finishing on every 3D printed piece.'
  },
  '/cart': {
    title: 'Your Cart | Print Queen 3D',
    description: 'Review your custom 3D printed items, then check out with shipping across the U.S. or free pickup in Los Angeles.'
  },
  '/checkout': {
    title: 'Checkout | Print Queen 3D',
    description: 'Secure checkout for your custom 3D printed order. Choose shipping or free Los Angeles pickup.'
  },
  '/login': {
    title: 'Sign In | Print Queen 3D',
    description: 'Sign in or create an account to order custom 3D printed products and track your orders.'
  },
  '/orders': {
    title: 'My Orders | Print Queen 3D',
    description: 'Track your custom 3D printed orders, shipping status, and pickup details.'
  },
  '/order-success': {
    title: 'Order Confirmed | Print Queen 3D',
    description: 'Thank you! Your custom 3D printed order has been received and is being prepared.'
  },
  '/refund-policy': {
    title: 'Refund Policy | Print Queen 3D',
    description: 'Refund and return policy for custom, personalized, and made-to-order 3D printed products from Print Queen 3D.'
  },
  '/product-care': {
    title: 'Product Care Guide | Print Queen 3D',
    description: 'How to care for your 3D printed products: cleaning, storage, and tips for NFC items, lithophane lights, keychains & home décor.'
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Print Queen 3D',
    description: 'How Print Queen 3D collects, uses, and protects your information when you order custom 3D printed products.'
  },
  '/terms-of-service': {
    title: 'Terms of Service | Print Queen 3D',
    description: 'Terms of service for ordering custom and personalized 3D printed products from Print Queen 3D.'
  },
  '/shipping-policy': {
    title: 'Shipping & Pickup Policy | Print Queen 3D',
    description: 'Shipping timelines, production times, and free Los Angeles pickup details for custom 3D printed orders.'
  },
  '/admin': {
    title: 'Admin | Print Queen 3D',
    description: 'Print Queen 3D store administration.'
  }
};
