import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Heart, Mail, MapPin, Phone, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import SiteFooter from '../components/SiteFooter';
import ColorPicker, { COLORS } from '../components/ColorPicker';

const quoteDefaults = {
  full_name: '',
  email: '',
  phone: '',
  use_type: '',
  product_id: '',
  product_name: '',
  creation_type: '',
  quantity_needed: '',
  preferred_colors: '',
  size_needed: '',
  need_by_date: '',
  nfc_link: '',
  nfc_links: ['', '', ''],
  material_request: '',
  resin_overlay: false,
  qr_code_note: '',
  project_details: '',
  special_ideas: '',
  delivery_method: '',
  delivery_fee: 0,
  attachment_image_url: '',
  attachment_public_id: '',
};

const deliveryOptions = [
  { label: 'Local Pickup: Los Angeles', value: 'Local Pickup: Los Angeles', fee: 0 },
  { label: 'Express Pickup: Los Angeles (+$15)', value: 'Express Pickup: Los Angeles', fee: 15 },
  { label: 'Shipping (+$12.95)', value: 'Shipping', fee: 12.95 },
  { label: 'Express Manufacturing & Shipping (+$25.95)', value: 'Express Manufacturing & Shipping', fee: 25.95 },
];

const collectionNames = [
  'Personalized Favorites',
  'Business Solutions',
  'Keychains & Charms',
  'Gifts & Keepsakes',
  'Home Décor & Lithophanes',
  'Fidgets & Fun',
];

const triColorOptions = [
  'Silky Triple-Color Red • Blue • Green',
  'Silky Triple-Color Purple • Blue • Pink',
  'Silky Triple-Color Black Cherry',
  'Silky Triple-Color Blackberry',
  'Silky Triple-Color Bright Blue • Raspberry',
  'Silky Triple-Color Rainbow',
  'Silky Triple-Color Rainbow 2',
  'Silky Triple-Color Pastel Rainbow',
  'Silky Triple-Color Gold • Copper • Bronze',
  'Silky Triple-Color Blue • Green • Purple',
  'Silky Triple-Color Sunset (Orange • Gold • Red)'
];

const filamentSwatchStyles = {
  'Silky Triple-Color Red • Blue • Green': { background: 'linear-gradient(135deg, #ef4444, #2563eb, #22c55e)' },
  'Silky Triple-Color Purple • Blue • Pink': { background: 'linear-gradient(135deg, #7c3aed, #2563eb, #ec4899)' },
  'Silky Triple-Color Black Cherry': { background: 'linear-gradient(135deg, #111827, #7f1d1d, #be123c)' },
  'Silky Triple-Color Blackberry': { background: 'linear-gradient(135deg, #111827, #4c1d95, #7e22ce)' },
  'Silky Triple-Color Bright Blue • Raspberry': { background: 'linear-gradient(135deg, #0284c7, #38bdf8, #db2777)' },
  'Silky Triple-Color Rainbow': { background: 'linear-gradient(135deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #8b5cf6)' },
  'Silky Triple-Color Rainbow 2': { background: 'linear-gradient(135deg, #ec4899, #f97316, #84cc16, #06b6d4, #6366f1)' },
  'Silky Triple-Color Pastel Rainbow': { background: 'linear-gradient(135deg, #fbcfe8, #fde68a, #bbf7d0, #bae6fd, #ddd6fe)' },
  'Silky Triple-Color Gold • Copper • Bronze': { background: 'linear-gradient(135deg, #facc15, #c2410c, #92400e)' },
  'Silky Triple-Color Blue • Green • Purple': { background: 'linear-gradient(135deg, #2563eb, #16a34a, #7c3aed)' },
  'Silky Triple-Color Sunset (Orange • Gold • Red)': { background: 'linear-gradient(135deg, #f97316, #facc15, #dc2626)' }
};

const normalizeCollectionName = (name = '') => (
  name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
);

const fetchSiteBundle = async () => {
  const [siteResponse, collectionsResponse] = await Promise.all([
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`),
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/collections`)
  ]);
  return {
    siteConfig: await siteResponse.json(),
    collections: await collectionsResponse.json()
  };
};

const getCollectionImage = (collection) => (
  collection.image_url || collection.cover_image_url || collection.image || ''
);

const getProductImage = (product) => (
  Array.isArray(product.images) ? product.images.find(Boolean) : product.image || ''
);

const getCollectionLink = (collection) => (
  (collection.name || '').trim().toLowerCase() === 'design your own'
    ? '/design-your-own'
    : `/shop?collection=${encodeURIComponent(collection.id)}`
);

const getSectionContent = (siteConfig, sectionId, field, defaultValue = '') => {
  const section = siteConfig?.homepage_sections?.find((item) => item.id === sectionId);
  return section?.content?.[field] ?? defaultValue;
};

const renderSectionBadge = (siteConfig, sectionId, defaultValue = '') => {
  const label = getSectionContent(siteConfig, sectionId, 'badge_label', defaultValue);
  return label?.trim() ? <span className="hero-badge">{label}</span> : null;
};

const policyPageDefaults = {
  refund_policy_page: {
    title: 'Refund Policy',
    content: `At Print Queen 3D, every product is made with care and many of our items are custom-made specifically for each customer. Because of the personalized nature of our products, all personalized, custom-made, and made-to-order products are final sale.

Once production has begun, orders cannot be canceled, refunded, or exchanged. Please carefully review all names, dates, colors, sizes, spellings, logos, photos, and customization details before submitting your order. Print Queen 3D is not responsible for customer-submitted errors that are approved prior to production.

Non-custom products may be eligible for return on a case-by-case basis within 14 days of delivery if they are unused, in their original condition, and in their original packaging. Approved returns may be subject to a 15% restocking fee. Customers are responsible for all return shipping costs unless the return is due to our error.

Please inspect your order immediately upon arrival. If your order arrives damaged, defective, or incorrect, contact us within 24 hours of delivery by emailing printqueen3d@gmail.com. Include your order number, a description of the issue, clear photos of the product, and photos of the packaging if shipping damage occurred.

We will review each claim and, if approved, repair, replace, or remake the item at no additional cost. Claims submitted after 24 hours may not qualify for replacement or repair.

Carrier delivery estimates are not guaranteed. Print Queen 3D is not responsible for delays caused by USPS, UPS, FedEx, weather conditions, holidays, customs, or other carrier-related issues.

Requests to modify an order must be made before production begins. Once production starts, customization changes cannot be guaranteed and additional charges may apply.

Questions regarding refunds or returns may be sent to printqueen3d@gmail.com or (310) 936-1893.`
  },
  product_care_page: {
    title: 'Product Care',
    content: `Thank you for choosing Print Queen 3D. Each item is expertly designed and 3D printed with care. Proper care will help ensure your product remains beautiful for years to come.

General Care:
Handle products with care. Avoid dropping or exposing items to excessive force. Store in a cool, dry location. Keep away from prolonged direct sunlight and excessive heat. Clean using a soft microfiber cloth. For stubborn dirt, wipe gently with a damp cloth and mild soap. Do not use abrasive cleaners, acetone, bleach, alcohol, or harsh chemicals.

Personalized Products:
Customized products are created specifically for you. Avoid scratching engraved or printed surfaces and keep personalized items away from excessive moisture unless otherwise noted.

NFC Products:
Do not bend or puncture NFC-enabled products. Avoid prolonged exposure to high temperatures, magnets, or excessive moisture. Clean gently with a soft cloth.

Lithophane Night Lights:
Indoor use only. Keep away from water and excessive humidity. Use only the recommended light source included with your product. Do not place near open flames or excessive heat.

Keychains & Charms:
Avoid placing heavy weight or excessive pressure on acrylic or printed keychains. Metal hardware may naturally wear over time depending on usage.

Home Décor:
Decorative items, including vases, nameplates, wall décor, incense holders, and lithophane lamps, are intended for display. Do not use products for purposes other than their intended design.

Product Variations:
Due to the custom 3D printing process, slight variations in color, texture, finish, or layer appearance may occur. These variations are a normal part of 3D printing and make each item unique.`
  },
  privacy_policy_page: {
    title: 'Privacy Policy',
    content: `Print Queen 3D respects your privacy and is committed to protecting your personal information.

When you place an order, submit a custom inquiry, or use our website, we may collect your name, email address, phone number, shipping and billing address, payment information processed securely by our payment providers, uploaded photos, logos, artwork, files, form messages, device information, browser information, and website usage analytics.

We use this information to process orders, manufacture custom products, communicate about your order, provide customer support, improve our website, prevent fraud, comply with legal obligations, and send marketing messages if you choose to subscribe.

Print Queen 3D does not store complete credit card information. Payments are processed securely by trusted third-party payment providers.

If you upload or submit logos, photographs, artwork, or designs, you confirm that you have the legal right to use those materials. You retain ownership of your intellectual property.

If you subscribe to our mailing list, we may send updates, promotions, and new product announcements. You may unsubscribe at any time.

Our website may use cookies and similar technologies to improve your browsing experience and analyze website traffic. You may disable cookies through your browser settings, although some website features may not function properly.

We use commercially reasonable safeguards to protect your information. While no system can guarantee absolute security, we work to protect your data from unauthorized access.

You may request to access, correct, or delete eligible personal information, or opt out of marketing communications by emailing printqueen3d@gmail.com.

Questions regarding this Privacy Policy may be directed to:
Print Queen 3D
Email: printqueen3d@gmail.com
Phone: (310) 936-1893`
  },
  terms_of_service_page: {
    title: 'Terms of Service',
    content: `Welcome to Print Queen 3D. By accessing our website, placing an order, submitting a custom request, or using our services, you agree to these Terms of Service.

Print Queen 3D provides custom 3D printed products, personalized gifts, NFC products, business branding items, home décor, lithophane night lights, fidgets, event items, and related custom design services. Our website and services are intended for customers in the United States only.

All product descriptions, pricing, availability, and processing timelines are subject to change at any time without notice. We reserve the right to refuse service, cancel orders, or limit quantities at our discretion.

Because many of our products are custom-made, customers are responsible for carefully reviewing all order details before submitting payment. This includes names, spelling, dates, colors, photos, logos, sizes, quantities, personalization details, and any approved design proofs.

Once production has begun, custom orders cannot be canceled, refunded, or exchanged. Personalized and made-to-order items are final sale unless they arrive damaged, defective, or incorrect due to our error.

Production typically takes 3-5 days after design approval, depending on product type, project complexity, material availability, and order volume. Rush production may be available for an additional fee. Production timelines do not include carrier shipping time, weekends, or holidays unless otherwise stated.

Customers who submit photos, artwork, logos, business names, slogans, or other design materials confirm that they have the legal right to use those materials. Print Queen 3D is not responsible for claims arising from customer-submitted content.

All website content, product images, product designs, logos, text, graphics, and branding created by Print Queen 3D are protected intellectual property and may not be copied, reproduced, sold, or used without written permission.

Shipping estimates are not guaranteed. Print Queen 3D is not responsible for delays caused by shipping carriers, weather, holidays, incorrect addresses, or events outside our control.

Local pickup may be available in Los Angeles, California. Pickup details will be provided when applicable.

Customers must inspect items upon delivery and report any damaged, defective, or incorrect items within 24 hours by emailing printqueen3d@gmail.com with photos and order details.

Print Queen 3D is not responsible for damage caused after delivery, including drops, misuse, exposure to heat, improper cleaning, water damage, or normal wear and tear.

To the fullest extent permitted by law, Print Queen 3D is not liable for indirect, incidental, special, or consequential damages arising from use of our website, products, or services.

We may update these Terms of Service at any time. Continued use of our website after changes are posted means you accept the updated terms.

For questions, contact:
Print Queen 3D
Email: printqueen3d@gmail.com
Phone: (310) 936-1893`
  },
  shipping_policy_page: {
    title: 'Shipping Policy',
    content: `Print Queen 3D currently serves customers in the United States only.

Production typically takes 3-5 days after design approval, depending on product type, project complexity, material availability, and order volume. Production timelines do not include carrier shipping time, weekends, or holidays unless otherwise stated.

Shipping estimates are not guaranteed. Print Queen 3D is not responsible for delays caused by USPS, UPS, FedEx, weather, holidays, incorrect addresses, or events outside our control.

Customers are responsible for entering a complete and accurate shipping address at checkout. If an order is returned due to an incorrect or incomplete address, additional shipping fees may apply.

Local pickup may be available in Los Angeles, California. Pickup details will be provided when applicable.

For shipping questions, contact:
Print Queen 3D
Email: printqueen3d@gmail.com
Phone: (310) 936-1893`
  }
};

const renderPolicyContent = (content) => (
  content.split('\n').map((line, index) => {
    const text = line.trim();
    if (!text) return null;
    if (text.endsWith(':') && text.length < 80) {
      return <h2 key={`${text}-${index}`} className="text-2xl font-bold text-gray-900 mt-8 mb-3">{text.replace(':', '')}</h2>;
    }
    return <p key={`${text}-${index}`} className="text-gray-600 leading-relaxed mb-4">{text}</p>;
  })
);

const PageShell = ({ children, siteConfig }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
    <Navbar />
    {children}
    <SiteFooter siteConfig={siteConfig} />
  </div>
);

export const PersonalizePage = () => {
  const [siteConfig, setSiteConfig] = useState(null);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    fetchSiteBundle()
      .then(({ siteConfig: config, collections: collectionData }) => {
        setSiteConfig(config);
        setCollections(collectionData);
      })
      .catch(() => {});
  }, []);

  const featuredCollections = collectionNames
    .map((name) => collections.find((collection) => normalizeCollectionName(collection.name || '') === normalizeCollectionName(name)))
    .filter(Boolean);
  const displayCollections = featuredCollections.length ? featuredCollections : collections.slice(0, 6);

  return (
    <PageShell siteConfig={siteConfig}>
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            {renderSectionBadge(siteConfig, 'personalize_page', 'Personalize')}
            <h1 className="section-title mb-4">{getSectionContent(siteConfig, 'personalize_page', 'headline', 'Made Just for You')}</h1>
            <p className="text-lg text-gray-600">
              {getSectionContent(siteConfig, 'personalize_page', 'subheadline', 'Browse personalized favorites, keepsakes, décor, charms, fidgets, and celebration pieces. Add names, logos, colors, photos, QR codes, NFC chips, messages, or a completely custom design.')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCollections.map((collection) => {
              const image = getCollectionImage(collection);
              return (
                <a key={collection.id} href={getCollectionLink(collection)} className="group product-card rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                    {image ? (
                      <img src={image} alt={collection.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-blue-200">{collection.name?.charAt(0) || 'P'}</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{collection.name}</h2>
                    {collection.description && <p className="text-sm text-gray-600 line-clamp-3 min-h-[60px]">{collection.description}</p>}
                    <span className="inline-flex mt-5 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">Personalize Yours</span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-12 rounded-xl bg-gradient-to-r from-blue-600 to-green-600 p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-3">✨ Made Just for You</h2>
            <p className="text-lg opacity-95 max-w-3xl mx-auto mb-6">
              Personalize with your name, logo, colors, photo, QR code, NFC chip, message, or custom design.
            </p>
            <Link to="/design-your-own" className="inline-flex bg-white text-blue-700 px-7 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors">
              {getSectionContent(siteConfig, 'personalize_page', 'button_text', 'Start Custom Order')}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export const DesignYourOwnPage = () => {
  const [siteConfig, setSiteConfig] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [form, setForm] = useState(quoteDefaults);
  const [inspirationImage, setInspirationImage] = useState(null);
  const [colorSelection, setColorSelection] = useState({ group: '', singleColor: '', triColor: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`).then((response) => response.json()),
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/products?published=true`).then((response) => response.json()),
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/collections`).then((response) => response.json())
    ])
      .then(([siteData, productData, collectionData]) => {
        setSiteConfig(siteData);
        setProducts(productData || []);
        setCollections(collectionData || []);
      })
      .catch(() => {});
  }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateColorSelection = (field, value) => setColorSelection((current) => ({ ...current, [field]: value }));
  const chooseColorGroup = (group) => setColorSelection((current) => ({
    group,
    singleColor: group === 'single' ? current.singleColor : '',
    triColor: group === 'tri_color' ? current.triColor : ''
  }));
  const updateNfcLink = (index, value) => setForm((current) => {
    const links = [...(current.nfc_links || ['', '', ''])];
    links[index] = value;
    return { ...current, nfc_links: links, nfc_link: links.filter(Boolean).join(' | ') };
  });
  const designCollectionOptions = (() => {
    const normalizedCollections = collections.map((collection) => ({
      ...collection,
      normalizedName: normalizeCollectionName(collection.name || '')
    }));
    const orderedCollections = collectionNames
      .map((name) => normalizedCollections.find((collection) => collection.normalizedName === normalizeCollectionName(name)))
      .filter(Boolean);
    const orderedIds = new Set(orderedCollections.map((collection) => collection.id));
    const remainingCollections = normalizedCollections.filter((collection) => !orderedIds.has(collection.id));
    const combinedCollections = [...orderedCollections, ...remainingCollections].slice(0, 6);

    if (combinedCollections.length > 0) return combinedCollections;

    return collectionNames.map((name) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name
    }));
  })();

  const updateProduct = (choiceId) => {
    if (choiceId === 'something_else') {
      setForm((current) => ({
        ...current,
        product_id: 'something_else',
        product_name: 'Something Else',
        creation_type: 'Something Else'
      }));
      return;
    }

    const collectionId = choiceId.replace('collection:', '');
    const collection = designCollectionOptions.find((item) => item.id === collectionId);
    setForm((current) => ({
      ...current,
      product_id: choiceId,
      product_name: collection?.name || '',
      creation_type: collection?.name || ''
    }));
  };
  const updateDeliveryMethod = (value) => {
    const option = deliveryOptions.find((item) => item.value === value);
    setForm((current) => ({
      ...current,
      delivery_method: value,
      delivery_fee: option?.fee || 0
    }));
  };
  const getSelectedColorDescription = () => {
    if (colorSelection.group === 'original') {
      return 'Original Printed Color - use the colors shown in the product photos or reference image.';
    }
    if (colorSelection.group === 'single') {
      const selectedColor = COLORS.find((color) => color.hex === colorSelection.singleColor);
      return selectedColor
        ? `Single Color Request - ${selectedColor.name} (${selectedColor.hex})`
        : '';
    }
    if (colorSelection.group === 'tri_color') {
      return colorSelection.triColor ? `Tri Color Filament - ${colorSelection.triColor}` : '';
    }
    return '';
  };

  const validateColorSelection = () => {
    if (!colorSelection.group) {
      toast.error('Please choose Original Color, Single Color, or Tri Color.');
      return false;
    }
    if (colorSelection.group === 'single' && !colorSelection.singleColor) {
      toast.error('Please choose a single color swatch.');
      return false;
    }
    if (colorSelection.group === 'tri_color' && !colorSelection.triColor) {
      toast.error('Please choose a tri color filament.');
      return false;
    }
    return true;
  };

  const renderDesignColorSelector = () => {
    const mainOptions = [
      {
        id: 'original',
        label: 'Original Color',
        description: 'Use the colors shown in the product photos or your reference image.',
        swatchStyle: { background: 'linear-gradient(135deg, #f8fafc, #dbeafe, #dcfce7)' }
      },
      {
        id: 'single',
        label: 'Single Color',
        description: 'Choose one solid color from the color swatches.',
        swatchStyle: { background: 'linear-gradient(135deg, #111827, #f8fafc)' }
      },
      {
        id: 'tri_color',
        label: 'Tri Color',
        description: 'Choose one silky triple-color filament blend.',
        swatchStyle: { background: 'linear-gradient(135deg, #ec4899, #f59e0b, #22c55e, #3b82f6, #7c3aed)' }
      }
    ];

    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-4">
        <div>
          <span className="block text-sm font-semibold text-gray-700">Color Option *</span>
          <p className="mt-1 text-sm text-gray-600">Choose how you want the product color handled for this made-to-order 3D print.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {mainOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => chooseColorGroup(option.id)}
              className={`rounded-xl border-2 bg-white p-4 text-left transition-all ${
                colorSelection.group === option.id ? 'border-blue-500 shadow-sm ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <span className="mb-3 block h-10 w-10 rounded-full border border-gray-200" style={option.swatchStyle} />
              <span className="block text-base font-bold text-gray-900">{option.label}</span>
              <span className="mt-1 block text-xs text-gray-600">{option.description}</span>
            </button>
          ))}
        </div>
        {colorSelection.group === 'original' && (
          <p className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            Your item will be printed using the colors shown in the product photos or reference image when possible.
          </p>
        )}
        {colorSelection.group === 'single' && (
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <ColorPicker
              label="Choose Single Color"
              value={colorSelection.singleColor}
              onChange={(colorHex) => updateColorSelection('singleColor', colorHex)}
              dataTestId="design-own-single-color-picker"
            />
          </div>
        )}
        {colorSelection.group === 'tri_color' && (
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <span className="mb-3 block text-sm font-semibold text-gray-700">Choose Tri Color</span>
            <div className="grid sm:grid-cols-2 gap-3">
              {triColorOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateColorSelection('triColor', option)}
                  className={`flex items-center gap-3 rounded-xl border-2 bg-white p-3 text-left transition-all ${
                    colorSelection.triColor === option ? 'border-blue-500 shadow-sm ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <span className="h-10 w-10 shrink-0 rounded-full border border-gray-200" style={filamentSwatchStyles[option]} />
                  <span className="text-sm font-semibold text-gray-800">{option}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateColorSelection()) return;
    setSubmitting(true);
    try {
      let attachmentData = {};

      if (inspirationImage) {
        const uploadData = new FormData();
        uploadData.append('file', inspirationImage);
        const uploadResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/custom-quote-uploads`, {
          method: 'POST',
          body: uploadData,
        });

        if (!uploadResponse.ok) throw new Error('Image upload failed');
        const uploadedImage = await uploadResponse.json();
        attachmentData = {
          attachment_image_url: uploadedImage.secure_url,
          attachment_public_id: uploadedImage.public_id
        };
      }

      const selectedProduct = products.find((item) => item.id === form.product_id);
      const preferredColors = getSelectedColorDescription();
      const payload = {
        ...form,
        ...attachmentData,
        preferred_colors: preferredColors,
        project_details: form.product_id === 'something_else'
          ? form.project_details
          : (form.special_ideas || `Custom request for ${selectedProduct?.name || form.product_name}`)
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/custom-quote-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Quote request failed');
      setSubmitted(true);
      setForm(quoteDefaults);
      setColorSelection({ group: '', singleColor: '', triColor: '' });
      setInspirationImage(null);
      toast.success('Your custom request has been received.');
    } catch (error) {
      toast.error('We could not submit your request yet. Please email printqueen3d@gmail.com.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSomethingElse = form.product_id === 'something_else';
  const selectedProduct = products.find((item) => item.id === form.product_id);
  const selectedProductText = `${selectedProduct?.name || ''} ${selectedProduct?.category || ''} ${selectedProduct?.description || ''}`.toLowerCase();
  const isSelectedNfcProduct = Boolean(!isSomethingElse && selectedProduct && (
    selectedProductText.includes('nfc') ||
    selectedProductText.includes('tap') ||
    selectedProductText.includes('qr')
  ));
  const selectedDelivery = deliveryOptions.find((option) => option.value === form.delivery_method);
  const productBelongsToCollection = (product, collection) => {
    const productCollectionIds = [
      ...(Array.isArray(product.collection_ids) ? product.collection_ids : []),
      product.primary_collection_id,
      product.collection_id
    ].filter(Boolean);
    const productCategory = normalizeCollectionName(product.category || '');
    const collectionName = normalizeCollectionName(collection.name || '');

    return productCollectionIds.includes(collection.id) || Boolean(productCategory && productCategory === collectionName);
  };
  const designInspirationProducts = (() => {
    const selected = [];
    const seenProductIds = new Set();
    const sourceCollections = designCollectionOptions
      .filter((collection) => normalizeCollectionName(collection.name || '') !== normalizeCollectionName('Design Your Own'))
      .filter((collection) => products.some((product) => productBelongsToCollection(product, collection)))
      .slice(0, 5);

    sourceCollections.forEach((collection) => {
      const collectionProducts = products
        .filter((product) => productBelongsToCollection(product, collection))
        .slice(0, 2);

      collectionProducts.forEach((product) => {
        if (!seenProductIds.has(product.id) && selected.length < 10) {
          selected.push({ ...product, collection_name: collection.name });
          seenProductIds.add(product.id);
        }
      });
    });

    return selected.slice(0, 10);
  })();

  return (
    <PageShell siteConfig={siteConfig}>
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
          <div className="lg:sticky lg:top-28 text-center lg:text-left">
            {renderSectionBadge(siteConfig, 'design_page', 'Design Your Own')}
            <h1 className="section-title mb-5">{getSectionContent(siteConfig, 'design_page', 'headline', 'Design Your Own Custom 3D Print')}</h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {getSectionContent(siteConfig, 'design_page', 'description', "Tell us what you want to create and we'll review your details, timeline, materials, and next steps.")}
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3 text-gray-700">
              <div>
                <p><strong>Timeline:</strong> Manufacturing time depends on the product you are ordering.</p>
                <ul className="mt-3 space-y-2 list-disc list-inside text-sm leading-6">
                  <li>If we have something in stock, it will be shipped next day.</li>
                  <li>Production typically takes 3-5 days after design approval, depending on product type and order details.</li>
                  <li>Shipping or delivery time is separate from production time.</li>
                  <li>You can shorten delivery time by using express delivery when available.</li>
                </ul>
              </div>
              <p>Email any additional large logos, STL files, or reference images to printqueen3d@gmail.com after submitting your request.</p>
              <p><strong>Policy:</strong> Personalized items are custom-made and are final sale once production begins.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-8 space-y-5 text-left">
            {submitted && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-green-800 font-medium">Thank you! Your custom request has been received.</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <input required value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} placeholder="Full Name" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Phone" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <select required value={form.use_type} onChange={(event) => updateField('use_type', event.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Personal or business use?</option>
                <option value="Personal">Personal</option>
                <option value="Business">Business</option>
                <option value="Event">Event</option>
              </select>
            </div>

            <select required value={form.product_id} onChange={(event) => updateProduct(event.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">What would you like to create?</option>
              {designCollectionOptions.map((collection) => (
                <option key={collection.id} value={`collection:${collection.id}`}>{collection.name}</option>
              ))}
              <option value="something_else">Something Else</option>
            </select>

            {isSomethingElse ? (
              <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <textarea required rows="4" value={form.project_details} onChange={(event) => updateField('project_details', event.target.value)} placeholder="Special idea for print: describe the custom 3D print you want made, including shape, colors, size, use, and any inspiration details." className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
              </div>
            ) : isSelectedNfcProduct ? (
              <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-sm font-semibold text-blue-800">
                  The NFC will be linked to the exact URL you provide. Please make sure the link is correct.
                </p>
                <input
                  value={form.nfc_link}
                  onChange={(event) => {
                    updateField('nfc_link', event.target.value);
                    updateNfcLink(0, event.target.value);
                  }}
                  placeholder="URL link for NFC programming"
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <textarea
                  rows="2"
                  value={form.qr_code_note}
                  onChange={(event) => updateField('qr_code_note', event.target.value)}
                  placeholder="QR code note: Zelle, Venmo, Cash App, website, social media, or payment details. Send QR code image if needed."
                  className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-green-100 bg-green-50/70 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Add colors, quantity, size, date, and any special ideas below for this collection request.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-center sm:text-left">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Optional photo inspiration or reference image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setInspirationImage(event.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />
              <p className="text-xs text-gray-500 mt-2">Optional. Attach a photo, inspiration image, logo, sketch, or reference picture if it helps explain your custom request.</p>
              {inspirationImage && <p className="text-xs font-semibold text-blue-700 mt-2">Selected: {inspirationImage.name}</p>}
            </div>

            {renderDesignColorSelector()}

            <div className="grid md:grid-cols-2 gap-4">
              <input required value={form.quantity_needed} onChange={(event) => updateField('quantity_needed', event.target.value)} placeholder="Quantity" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input value={form.size_needed} onChange={(event) => updateField('size_needed', event.target.value)} placeholder="Size Requested" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input type="date" value={form.need_by_date} onChange={(event) => updateField('need_by_date', event.target.value)} aria-label="Date needed by" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <textarea rows="4" value={form.special_ideas} onChange={(event) => updateField('special_ideas', event.target.value)} placeholder="Any special ideas for your custom print?" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />

            <select required value={form.delivery_method} onChange={(event) => updateDeliveryMethod(event.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Delivery Method</option>
              {deliveryOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {selectedDelivery && selectedDelivery.fee > 0 && (
              <p className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
                This delivery option adds ${selectedDelivery.fee.toFixed(2)} to the product total.
              </p>
            )}
            <p className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
              Policy: Personalized items are custom-made and are final sale once production begins.
            </p>
            <button type="submit" disabled={submitting} className="w-full btn-primary text-lg py-4 disabled:opacity-70">
              {submitting ? 'Sending Request...' : getSectionContent(siteConfig, 'design_page', 'button_text', 'Get My Custom Quote')}
            </button>
          </form>
        </div>
      </section>
      {designInspirationProducts.length > 0 && (
        <section className="pb-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {designInspirationProducts.map((product) => {
                const productImage = getProductImage(product);
                return (
                  <Link key={product.id} to={`/products/${product.id}`} className="group rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
                      {productImage ? (
                        <img src={productImage} alt={product.image_alt || product.name} loading="lazy" decoding="async" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center px-3 text-center text-sm font-semibold text-gray-500">
                          {product.name}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{product.name}</h3>
                      {product.collection_name && <p className="mt-1 text-xs text-gray-500 line-clamp-1">{product.collection_name}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
};

export const AboutPage = () => {
  const [siteConfig, setSiteConfig] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`)
      .then((response) => response.json())
      .then(setSiteConfig)
      .catch(() => {});
  }, []);

  const defaultAboutHeadline = 'Turning Your Vision Into Reality';
  const defaultAboutCopy = [
    'At Print Queen 3D, we believe every great idea deserves to become something real. From personalized gifts and business branding to custom home décor, event keepsakes, NFC products, and one-of-a-kind creations, we specialize in designing and crafting high-quality 3D printed products made specifically for you.',
    'Every order is crafted with precision, quality PLA and PETG materials when appropriate, and expert finishing to ensure it not only looks incredible but is built to last. Whether you’re celebrating a milestone, growing your business, creating memorable event favors, or bringing a completely original idea to life, we’re committed to delivering products that are as unique as the people who order them.',
    'Based in Los Angeles, California, Print Queen 3D proudly serves customers nationwide with fast turnaround times, exceptional craftsmanship, and personalized service from concept to completion. We don’t just print products—we create meaningful pieces that tell stories, strengthen brands, celebrate life’s biggest moments, and leave lasting impressions.',
    'If you can imagine it, we can print it.'
  ];
  const aboutSection = siteConfig?.homepage_sections?.find((section) => section.id === 'about_page');
  const aboutContent = aboutSection?.content || {};
  const aboutHeadline = !aboutContent.headline || aboutContent.headline === 'About Print Queen 3D'
    ? defaultAboutHeadline
    : aboutContent.headline;
  const aboutDescription = !aboutContent.description || aboutContent.description === 'Based in Los Angeles, Print Queen 3D blends creativity, precision, and technology to produce high-quality custom 3D prints.'
    ? defaultAboutCopy
    : aboutContent.description.split('\n').filter(Boolean);
  const whyChooseItems = [
    '✨ Fully Personalized Designs',
    '👑 Precision 3D Printing',
    '🛠 Expert Finishing',
    '⚡ Production Time: 3-5 Days',
    '📍 Designed & Made in Los Angeles',
    '🚚 Nationwide U.S. Shipping',
    '🤝 One-on-One Design Support',
    '💡 Custom Solutions for Individuals & Businesses',
  ];

  return (
    <PageShell siteConfig={siteConfig}>
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="section-title mb-5">{aboutHeadline}</h1>
            <div className="space-y-5 text-lg text-gray-600 leading-relaxed">
              {aboutDescription.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100 p-6 md:p-8 mb-10">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Why Choose Print Queen 3D?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {whyChooseItems.map((item) => (
                <div key={item} className="bg-white rounded-xl border border-blue-100 p-4 text-gray-700 font-semibold shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 text-center">
              <Sparkles className="h-8 w-8 text-blue-600 mb-4 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To transform ideas into beautifully crafted, personalized 3D creations that inspire, celebrate, and connect people through quality, creativity, and innovation.
              </p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 text-center">
              <ShieldCheck className="h-8 w-8 text-blue-600 mb-4 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To become the leading destination for premium personalized 3D printing by combining exceptional craftsmanship, innovative design, and outstanding customer service into every product we create.
              </p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 text-center">
              <Heart className="h-8 w-8 text-blue-600 mb-4 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Promise</h2>
              <p className="text-gray-600 leading-relaxed">
                Every creation that leaves Print Queen 3D is made with care, attention to detail, and a commitment to quality. From your first idea to the finished product, our goal is simple:
              </p>
              <p className="text-xl font-bold text-blue-700 mt-4">Your Vision, Printed Perfectly.</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export const CorporateBulkOrdersPage = () => {
  const [siteConfig, setSiteConfig] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`)
      .then((response) => response.json())
      .then(setSiteConfig)
      .catch(() => {});
  }, []);

  const title = getSectionContent(siteConfig, 'corporate_bulk_page', 'headline', 'Corporate & Bulk Orders');
  const intro = getSectionContent(
    siteConfig,
    'corporate_bulk_page',
    'description',
    'Need custom 3D-printed products for your business, event, organization, school, or brand? Print Queen 3D creates professionally 3D printed bulk orders, branded pieces, event favors, NFC products, signage, keepsakes, and made-to-order custom items with precision and expert finishing.'
  );
  const buttonText = getSectionContent(siteConfig, 'corporate_bulk_page', 'button_text', 'Start a Bulk Order');
  const buttonLink = getSectionContent(siteConfig, 'corporate_bulk_page', 'button_link', '/design-your-own');
  const serviceCards = [
    ['Business Branding', 'Custom NFC stands, QR displays, logo pieces, signs, nameplates, and branded customer-facing products.'],
    ['Events & Organizations', 'Professionally 3D printed favors, keepsakes, awards, table displays, tags, and themed pieces made to order.'],
    ['Schools & Teams', 'Custom trophies, plaques, keychains, spirit items, recognition gifts, and bulk personalized pieces.'],
    ['Bulk Custom Gifts', 'Personalized products for launches, client gifts, staff appreciation, pop-ups, conferences, and celebrations.'],
  ];

  return (
    <PageShell siteConfig={siteConfig}>
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center lg:mx-0 lg:text-left">
            {renderSectionBadge(siteConfig, 'corporate_bulk_page', 'Corporate & Bulk')}
            <h1 className="section-title mb-5">{title}</h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">{intro}</p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
              <Link to={buttonLink} className="btn-primary text-center">{buttonText}</Link>
              <Link to="/contact" className="btn-secondary text-center">Ask a Question</Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {serviceCards.map(([cardTitle, cardText]) => (
              <div key={cardTitle} className="product-card rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">{cardTitle}</h2>
                <p className="text-sm text-gray-600 leading-6">{cardText}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-12">
            <div className="rounded-xl border border-gray-200 p-6 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How Bulk Orders Work</h2>
              <div className="space-y-4 text-gray-600">
                <p><strong>1. Share your project.</strong> Tell us what you need, quantity, colors, deadline, and any logos, links, or inspiration.</p>
                <p><strong>2. We review the details.</strong> We’ll confirm timeline, pricing, material fit, and production needs.</p>
                <p><strong>3. Your order is produced.</strong> Items are precision 3D printed, finished with care, and checked before pickup or shipping.</p>
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Good Fits for Corporate & Bulk</h2>
              <ul className="space-y-3 text-gray-700 list-disc list-inside">
                <li>NFC payment or social media stands</li>
                <li>QR code displays and business signage</li>
                <li>Event favors, branded keepsakes, and gifts</li>
                <li>Custom awards, plaques, nameplates, and desk pieces</li>
                <li>School, team, creator, and organization orders</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export const PolicyPage = ({ sectionId }) => {
  const [siteConfig, setSiteConfig] = useState(null);
  const fallback = policyPageDefaults[sectionId];

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`)
      .then((response) => response.json())
      .then(setSiteConfig)
      .catch(() => {});
  }, []);

  return (
    <PageShell siteConfig={siteConfig}>
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            {renderSectionBadge(siteConfig, sectionId, 'Policies')}
            <h1 className="section-title mb-4">
              {getSectionContent(siteConfig, sectionId, 'headline', fallback.title)}
            </h1>
          </div>
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-green-50/70 p-5 md:p-8">
            <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-8 shadow-sm text-left">
              {renderPolicyContent(getSectionContent(siteConfig, sectionId, 'description', fallback.content))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export const MaterialsPage = () => {
  const [siteConfig, setSiteConfig] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`)
      .then((response) => response.json())
      .then(setSiteConfig)
      .catch(() => {});
  }, []);

  const content = getSectionContent(
    siteConfig,
    'materials_page',
    'description',
    'All Print Queen 3D items are professionally designed and 3D printed with care. Common materials include PLA filament, PETG filament, resin when needed, and acrylic for select custom pieces by request.'
  );

  return (
    <PageShell siteConfig={siteConfig}>
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          {renderSectionBadge(siteConfig, 'materials_page', '3D Printed')}
          <h1 className="section-title mb-5">{getSectionContent(siteConfig, 'materials_page', 'headline', 'Materials & 3D Printing')}</h1>
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-green-50/70 p-5 md:p-8">
            <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-8 shadow-sm text-center md:text-left space-y-5 text-gray-600 leading-relaxed">
              {content.split('\n').filter(Boolean).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <Link to="/design-your-own" className="inline-flex btn-primary mt-8">Request a Custom Material or Finish</Link>
        </div>
      </section>
    </PageShell>
  );
};

export const ContactPage = () => {
  const [siteConfig, setSiteConfig] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', instagram: '', tiktok: '', website: '', collaboration_idea: '' });
  const [submitting, setSubmitting] = useState(false);
  const contactInfo = siteConfig?.settings?.contact_info || {};
  const contactEmail = contactInfo.email || 'printqueen3d@gmail.com';
  const contactPhone = contactInfo.phone || '(310) 936-1893';

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/site-config`)
      .then((response) => response.json())
      .then(setSiteConfig)
      .catch(() => {});
  }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/partner-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Contact failed');
      setForm({ name: '', email: '', instagram: '', tiktok: '', website: '', collaboration_idea: '' });
      toast.success('Your message was received.');
    } catch (error) {
      toast.error('We could not send this yet. Please email printqueen3d@gmail.com.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell siteConfig={siteConfig}>
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10">
          <div className="text-center lg:text-left">
            {renderSectionBadge(siteConfig, 'contact_page', 'Contact')}
            <h1 className="section-title mb-5">{getSectionContent(siteConfig, 'contact_page', 'headline', 'Contact Print Queen 3D')}</h1>
            <div className="space-y-4 text-gray-600 text-lg">
              <p>{getSectionContent(siteConfig, 'contact_page', 'description', 'Send a message, ask about a custom project, or start a partnership conversation.')}</p>
              <p><Mail className="inline h-5 w-5 text-blue-600 mr-2" /> <a href={`mailto:${contactEmail}`} className="hover:text-blue-700">{contactEmail}</a></p>
              <p><Phone className="inline h-5 w-5 text-blue-600 mr-2" /> <a href={`tel:${contactPhone.replace(/[^0-9]/g, '')}`} className="hover:text-blue-700">{contactPhone}</a></p>
              <p><MapPin className="inline h-5 w-5 text-blue-600 mr-2" /> Local pickup: Los Angeles, California</p>
              <p>Need a custom order? Use the guided request page so we can quote your project clearly.</p>
              <Link to="/design-your-own" className="inline-flex btn-primary mt-3">Start Custom Order</Link>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-8 space-y-4 text-left">
            <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Name" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="Email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <input value={form.instagram} onChange={(event) => updateField('instagram', event.target.value)} placeholder="Instagram" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <input value={form.tiktok} onChange={(event) => updateField('tiktok', event.target.value)} placeholder="TikTok" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <input value={form.website} onChange={(event) => updateField('website', event.target.value)} placeholder="Website" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <textarea required rows="5" value={form.collaboration_idea} onChange={(event) => updateField('collaboration_idea', event.target.value)} placeholder="How can we help?" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <button type="submit" disabled={submitting} className="w-full btn-primary text-lg py-4 disabled:opacity-70">
              {submitting ? 'Sending...' : getSectionContent(siteConfig, 'contact_page', 'button_text', 'Send Message')}
            </button>
          </form>
        </div>
      </section>
    </PageShell>
  );
};
