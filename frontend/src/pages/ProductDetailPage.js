import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, CartContext } from '../App';
import { Package, ShoppingCart, ArrowLeft, User, LogOut, MapPin, Truck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import ColorPicker, { COLORS } from '../components/ColorPicker';
import BuildYourStand from '../components/BuildYourStand';
import Navbar from '../components/Navbar';
import { Skeleton } from '../components/ui/skeleton';
import { motion } from 'framer-motion';
import { setBreadcrumbJsonLd, setPageMeta, setProductJsonLd } from '../lib/seo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NFC_ICON_OPTIONS = [
  'Instagram', 'TikTok', 'Facebook', 'YouTube', 'X', 'WhatsApp', 'Cash App',
  'Venmo', 'PayPal', 'Zelle', 'Website', 'Google Reviews', 'Phone', 'Email',
  'Discord', 'Messenger', 'Amazon', 'eBay', 'Booking', 'Custom Icon'
];

const STAND_BACK_SHAPES = [
  'Square', 'Vertical Rectangle', 'Rectangle', 'Wave', 'Hexagon', 'Arched',
  'Octagon', 'Circle', 'Heart', 'Cloud', 'Rounded Arch', 'Custom Shape / Submit Inquiry'
];

const STAND_BASES = [
  '1 NFC', '1 NFC Heart', '2 NFC', '3 NFC', '4 NFC',
  'Business Card Holder Only',
  'Business Card Holder + 1 NFC',
  'Business Card Holder + 2 NFC',
  'Business Card Holder + 3 NFC',
  'Business Card Holder + 4 NFC'
];

const FILAMENT_SWATCH_STYLES = {
  'Original Printed Color': { background: 'linear-gradient(135deg, #f8fafc, #dbeafe, #dcfce7)' },
  'Single Color Request': { background: 'linear-gradient(135deg, #111827, #f8fafc)' },
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

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState({});
  const [selectedColor, setSelectedColor] = useState('');
  const [customization, setCustomization] = useState({
    productColor: '',
    keychainColor: '',
    keychainSecondaryColor: '',
    chainColor: '',
    glitter: false,
    resinOverlay: false,
    materialRequest: '',
    personalizationDetails: '',
    nfcStandMode: '',
    nfcReadyMadeDesign: '',
    nfcBackShape: '',
    nfcBase: '',
    nfcBackShapeColor: '',
    nfcBaseColor: '',
    nfcSocialIconColor: '',
    nfcBusinessCardHolderColor: '',
    nfcIconCount: '1',
    nfcIcons: ['', '', '', ''],
    nfcLinks: ['', '', '', ''],
    nfcBusinessName: '',
    nfcLogoUrl: '',
    nfcLogoPublicId: '',
    nfcLogoFileName: '',
    nfcQrCodeUrl: '',
    nfcQrCodePublicId: '',
    nfcQrCodeFileName: '',
    nfcDisplayInsertStyle: '',
    nfcDesignNotes: '',
    nfcAddOns: [],
    nfcKeychainStyle: '',
    nfcKeychainPrimaryColor: '',
    nfcKeychainSecondaryColor: '',
    nfcKeychainIcon: '',
    nfcKeychainUrl: '',
    nfcKeychainBusinessName: '',
    nfcKeychainLogoUrl: '',
    nfcKeychainLogoPublicId: '',
    nfcKeychainLogoFileName: '',
    nfcKeychainQrCodeUrl: '',
    nfcKeychainQrCodePublicId: '',
    nfcKeychainQrCodeFileName: '',
    nfcKeychainNotes: '',
    nfcKeychainResinFinish: false,
    photoInstructions: '',
    inspirationImageUrl: '',
    inspirationPublicId: '',
    inspirationFileName: '',
    productFieldValues: {}
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [uploadingField, setUploadingField] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setSelectedImage(0);
      setQuantity(1);
      setSelectedVariant({});
      setSelectedColor('');
      setCustomization({
        productColor: '',
        keychainColor: '',
        keychainSecondaryColor: '',
        chainColor: '',
        glitter: false,
        resinOverlay: false,
        materialRequest: '',
        personalizationDetails: '',
        nfcStandMode: '',
        nfcReadyMadeDesign: '',
        nfcBackShape: '',
        nfcBase: '',
        nfcBackShapeColor: '',
        nfcBaseColor: '',
        nfcSocialIconColor: '',
        nfcBusinessCardHolderColor: '',
        nfcIconCount: '1',
        nfcIcons: ['', '', '', ''],
        nfcLinks: ['', '', '', ''],
        nfcBusinessName: '',
        nfcLogoUrl: '',
        nfcLogoPublicId: '',
        nfcLogoFileName: '',
        nfcQrCodeUrl: '',
        nfcQrCodePublicId: '',
        nfcQrCodeFileName: '',
        nfcDisplayInsertStyle: '',
        nfcDesignNotes: '',
        nfcAddOns: [],
        nfcKeychainStyle: '',
        nfcKeychainPrimaryColor: '',
        nfcKeychainSecondaryColor: '',
        nfcKeychainIcon: '',
        nfcKeychainUrl: '',
        nfcKeychainBusinessName: '',
        nfcKeychainLogoUrl: '',
        nfcKeychainLogoPublicId: '',
        nfcKeychainLogoFileName: '',
        nfcKeychainQrCodeUrl: '',
        nfcKeychainQrCodePublicId: '',
        nfcKeychainQrCodeFileName: '',
        nfcKeychainNotes: '',
        nfcKeychainResinFinish: false,
        photoInstructions: '',
        inspirationImageUrl: '',
        inspirationPublicId: '',
        inspirationFileName: '',
        productFieldValues: {}
      });
      const response = await axios.get(`${API}/products/${id}`);
      const productData = response.data;
      
      setProduct(productData);

      setPageMeta({
        title: `${productData.name} | Print Queen 3D`,
        description: (productData.description || '').slice(0, 155).trim(),
        path: `/products/${productData.id}`,
        image: productData.images?.[0]
      });
      setProductJsonLd(productData);
      setBreadcrumbJsonLd([
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/shop' },
        productData.category ? { name: productData.category, url: `/shop?category=${encodeURIComponent(productData.category)}` } : null,
        { name: productData.name, url: `/products/${productData.id}` }
      ].filter(Boolean));

      // Show color picker if product has color options
      setShowColorPicker(Boolean(productData.available_colors && productData.available_colors.length > 0));

      // Fetch products from the same collection first so the side gallery stays relevant.
      fetchRelatedProducts(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (productData) => {
    try {
      const currentProductId = productData.id;
      const collectionIds = productData.collection_ids || [];
      let relatedPool = [];

      if (collectionIds.length > 0) {
        const collectionResponses = await Promise.all(
          collectionIds.map((collectionId) => axios.get(`${API}/products?collection=${encodeURIComponent(collectionId)}`))
        );
        relatedPool = collectionResponses.flatMap((response) => response.data || []);
      }

      if (relatedPool.length === 0 && productData.category) {
        const response = await axios.get(`${API}/products?category=${encodeURIComponent(productData.category)}`);
        relatedPool = response.data || [];
      }

      const filtered = relatedPool
        .filter((p, index, products) => p.id !== currentProductId && p.published && products.findIndex((item) => item.id === p.id) === index)
        .slice(0, 12);
      setRelatedProducts(filtered);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const isCustomizableProduct = (productData) => {
    const customTerms = ['custom', 'personal', 'name', 'nfc', 'lithophane', 'photo', 'qr', 'keychain', 'logo', 'wedding', 'memorial'];
    const productText = `${productData?.name || ''} ${productData?.category || ''} ${productData?.description || ''}`.toLowerCase();
    return Boolean(
      productData?.is_custom ||
      productData?.custom_builder ||
      customTerms.some((term) => productText.includes(term))
    );
  };

  const productTypeText = `${product?.name || ''} ${product?.category || ''} ${product?.description || ''}`.toLowerCase();
  const isNfcProduct = productTypeText.includes('nfc') || productTypeText.includes('tap') || productTypeText.includes('qr');
  const isKeychainOrNecklace = productTypeText.includes('keychain') || productTypeText.includes('necklace');
  const isNfcKeychainProduct = isNfcProduct && productTypeText.includes('keychain');
  const isNfcStandProduct = isNfcProduct && !isNfcKeychainProduct && (
    productTypeText.includes('stand') ||
    productTypeText.includes('display') ||
    productTypeText.includes('hub') ||
    productTypeText.includes('business')
  );
  const isGuidedNfcProduct = isNfcStandProduct || isNfcKeychainProduct;
  const isPendantOrChain = productTypeText.includes('pendant') || productTypeText.includes('chain');
  const isLithophaneOrPhoto = productTypeText.includes('lithophane') || productTypeText.includes('photo') || productTypeText.includes('lamp');
  const isCustomizable = isCustomizableProduct(product);
  const hasProductCustomizationFields = (product?.customization_fields || []).length > 0;
  const hasComparePrice = Number(product?.compare_at_price) > Number(product?.price || 0);
  const displayProductName = isNfcStandProduct ? 'Custom NFC Business Stand' : isNfcKeychainProduct ? 'Custom NFC Keychain' : product?.name;
  const displayProductSubtitle = isNfcStandProduct ? 'Custom 3D-Printed Tap-to-Connect Stand' : isNfcKeychainProduct ? 'Tap-to-Connect Custom Keychain' : product?.subtitle;
  const displayProductDescription = product?.description || (isNfcStandProduct
    ? 'Create a custom 3D-printed NFC stand made for your brand. Choose your back shape, base style, colors, icons, and links to create a professional tap-to-connect display for payments, social media, websites, booking pages, reviews, menus, QR codes, and more.'
    : isNfcKeychainProduct
      ? 'Create a custom 3D-printed NFC keychain that connects customers, followers, or clients directly to your selected link. Choose your keychain style, color, icon, and URL, then upload your logo or QR code if needed.'
      : '');
  const readyMadeStandOptions = [product, ...relatedProducts]
    .filter(Boolean)
    .filter((stand, index, stands) => stands.findIndex((item) => item.id === stand.id) === index)
    .filter((stand) => {
      const standText = `${stand?.name || ''} ${stand?.category || ''} ${stand?.description || ''}`.toLowerCase();
      return standText.includes('nfc') &&
        !standText.includes('keychain') &&
        (standText.includes('stand') || standText.includes('display') || standText.includes('payment') || standText.includes('business') || standText.includes('hub'));
    });
  const selectedReadyMadeStand = readyMadeStandOptions.find((stand) => stand.id === customization.nfcReadyMadeDesign);
  const getNfcStandIconCount = (standOrText) => {
    const sourceText = typeof standOrText === 'string'
      ? standOrText
      : `${standOrText?.name || ''} ${standOrText?.subtitle || ''} ${standOrText?.category || ''} ${standOrText?.description || ''}`;
    const normalizedText = sourceText.toLowerCase();
    const explicitCount = normalizedText.match(/(\d+)\s*(icon|icons|nfc)/);

    if (explicitCount) {
      return Math.min(4, Math.max(0, Number(explicitCount[1]) || 0));
    }
    if (normalizedText.includes('business card holder only')) return 0;
    if (normalizedText.includes('trio')) return 3;
    if (normalizedText.includes('duo')) return 2;
    if (normalizedText.includes('hub')) return 3;

    return 1;
  };
  const standIconCount = customization.nfcStandMode === 'Ready-Made Design'
    ? getNfcStandIconCount(selectedReadyMadeStand)
    : getNfcStandIconCount(customization.nfcBase);
  const productImages = product?.images || [];
  const mainImage = productImages[selectedImage] || productImages[0];
  const sameCategoryGalleryItems = (() => {
    const seenImages = new Set(mainImage ? [mainImage] : []);
    const items = [];

    relatedProducts.forEach((relatedProduct) => {
      const image = relatedProduct.images?.[0];
      if (!image || seenImages.has(image)) return;
      seenImages.add(image);
      items.push({
        id: `related-product-${relatedProduct.id}`,
        type: 'reference',
        image,
        productId: relatedProduct.id,
        title: relatedProduct.name,
        subtitle: relatedProduct.subtitle || relatedProduct.category
      });
    });

    productImages.forEach((image, index) => {
      if (items.length >= 6 || !image || seenImages.has(image)) return;
      seenImages.add(image);
      items.push({
        id: `product-image-${index}`,
        type: 'image',
        image,
        imageIndex: index,
        title: displayProductName,
        subtitle: `Photo ${index + 1}`
      });
    });

    return items.slice(0, 6);
  })();
  const hasBusinessCardHolderBase = (customization.nfcBase || '').toLowerCase().includes('business card holder');
  const displayInsertApplies = ['Square', 'Circle'].includes(customization.nfcBackShape) || hasBusinessCardHolderBase;

  const formatPrice = (price, prefix = '') => {
    const amount = Number(price || 0).toFixed(2);
    return `${prefix ? `${prefix} ` : ''}$${amount}`;
  };

  const getProductFieldAdjustment = (field, optionValue) => (
    Number(field?.price_adjustments?.[optionValue] || 0)
  );

  // ---- Tri-Color Filament Add-On (+$5) ----
  const TRI_COLOR_ADDON_DEFAULT_PRICE = 5;
  const TRI_COLOR_COMPANION_COLORS = [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#111111' },
    { name: 'Gold', hex: '#D4AF37' },
    { name: 'Silver', hex: '#C0C0C0' }
  ];
  const TRI_COLOR_EXPLANATION = 'Tri-color filament is a specialty 3D printing filament that blends three colors into one material. As the item is printed, the colors shift depending on the angle, lighting, and shape of the design. This creates a unique multi-color effect without needing paint. Every tri-color print may look slightly different, making each piece one of a kind.';
  const TRI_COLOR_SECONDARY_NOTE = 'Because tri-color filament already includes three blended colors, only black, white, gold, or silver can be selected as the second color to keep the final print clean, readable, and professional.';

  const filamentColorFields = (product?.customization_fields || []).filter((field) => field.type === 'filament_color');
  const isTriColorSelectedOnField = (field) => (
    customization.productFieldValues?.[`${field.id}_color_group`] === 'tri_color'
  );
  const triColorSelectedField = filamentColorFields.find(isTriColorSelectedOnField) || null;
  const triColorAddOnPrice = triColorSelectedField
    ? Number(triColorSelectedField.tri_color_addon_price ?? TRI_COLOR_ADDON_DEFAULT_PRICE)
    : 0;

  const getProductFieldOptionPrice = (field, optionValue) => (
    Number(product?.price || 0) + getProductFieldAdjustment(field, optionValue)
  );

  const updateCustomization = (field, value) => {
    setCustomization((current) => ({ ...current, [field]: value }));
  };

  const updateProductField = (fieldId, value) => {
    setCustomization((current) => ({
      ...current,
      productFieldValues: {
        ...(current.productFieldValues || {}),
        [fieldId]: value
      }
    }));
  };

  const updateProductFields = (values) => {
    setCustomization((current) => ({
      ...current,
      productFieldValues: {
        ...(current.productFieldValues || {}),
        ...values
      }
    }));
  };

  const updateNfcLink = (index, value) => {
    setCustomization((current) => {
      const links = [...current.nfcLinks];
      links[index] = value;
      return { ...current, nfcLinks: links };
    });
  };

  const updateNfcIcon = (index, value) => {
    setCustomization((current) => {
      const icons = [...current.nfcIcons];
      icons[index] = value;
      return { ...current, nfcIcons: icons };
    });
  };

  const toggleNfcAddOn = (id) => {
    setCustomization((current) => ({
      ...current,
      nfcAddOns: current.nfcAddOns.includes(id)
        ? current.nfcAddOns.filter((item) => item !== id)
        : [...current.nfcAddOns, id]
    }));
  };

  const uploadCustomizationImage = async (file, urlField, publicIdField, fileNameField) => {
    if (!file) return;
    setUploadingField(urlField);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const uploadResponse = await fetch(`${API}/custom-quote-uploads`, {
        method: 'POST',
        body: uploadData,
      });
      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadedImage = await uploadResponse.json();
      setCustomization((current) => ({
        ...current,
        [urlField]: uploadedImage.secure_url,
        [publicIdField]: uploadedImage.public_id,
        [fileNameField]: file.name
      }));
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      toast.error('Upload failed. Please try again or email the file after ordering.');
    } finally {
      setUploadingField('');
    }
  };

  const uploadProductFieldFile = async (file, field) => {
    if (!file || !field?.id) return;
    const uploadKey = `product-field-${field.id}`;
    setUploadingField(uploadKey);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const uploadResponse = await fetch(`${API}/custom-quote-uploads`, {
        method: 'POST',
        body: uploadData,
      });
      if (!uploadResponse.ok) throw new Error('Upload failed');
      const uploadedImage = await uploadResponse.json();
      setCustomization((current) => ({
        ...current,
        productFieldValues: {
          ...(current.productFieldValues || {}),
          [field.id]: uploadedImage.secure_url,
          [`${field.id}_file_name`]: file.name
        }
      }));
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      toast.error('Upload failed. Please try again or email the file after ordering.');
    } finally {
      setUploadingField('');
    }
  };

  const buildCustomizationDetails = () => {
    const details = {};
    (product?.customization_fields || []).forEach((field) => {
      const value = customization.productFieldValues?.[field.id];
      if (value) {
        details[field.label || field.id] = value;
        if (field.price_adjustments && Object.prototype.hasOwnProperty.call(field.price_adjustments, value)) {
          const adjustment = getProductFieldAdjustment(field, value);
          details[`${field.label || field.id} Price`] = field.type === 'checkbox'
            ? `+${formatPrice(adjustment)}`
            : formatPrice(getProductFieldOptionPrice(field, value));
        }
      }
      if (field.type === 'filament_color' && value === 'Single Color Request') {
        const singleColorValue = customization.productFieldValues?.[`${field.id}_single_color`];
        if (singleColorValue) {
          const selectedSingleColor = COLORS.find((color) => color.hex === singleColorValue);
          details[`${field.label || field.id} - Single Color Request`] = selectedSingleColor
            ? `${selectedSingleColor.name} (${selectedSingleColor.hex})`
            : singleColorValue;
        }
      }
    });
    if (triColorSelectedField) {
      details['Tri-Color Filament Add-On'] = `Yes (+$${triColorAddOnPrice.toFixed(2)})`;
    }
    if (selectedColor) details['Product Color'] = selectedColor;
    if (customization.productColor) details['Requested Color'] = customization.productColor;
    if (customization.keychainColor) details['Primary Keychain Color'] = customization.keychainColor;
    if (customization.keychainSecondaryColor) details['Secondary Keychain Color'] = customization.keychainSecondaryColor;
    if (customization.chainColor) details['Chain Color'] = customization.chainColor;
    if (customization.glitter) details['Glitter for Chain'] = 'Yes (+$3.00)';
    if (customization.resinOverlay) details['Resin Overlay'] = 'Yes (+$5.00)';
    if (customization.materialRequest) details['Material Request'] = customization.materialRequest;
    if (customization.personalizationDetails) details['Personalization Details'] = customization.personalizationDetails;
    if (isLithophaneOrPhoto) {
      details['Photo Instructions'] = customization.photoInstructions || 'Customer must email photo/reference to printqueen3d@gmail.com after ordering.';
    }
    if (customization.inspirationImageUrl) {
      details['Optional Inspiration Image'] = customization.inspirationImageUrl;
    }
    if (customization.inspirationFileName) {
      details['Inspiration File Name'] = customization.inspirationFileName;
    }
    if (isNfcStandProduct) {
      const linkCount = standIconCount;
      details['NFC Product Type'] = 'Custom NFC Business Stand';
      if ((product?.customization_fields || []).length === 0) {
      details['Step 1 - Stand Choice'] = customization.nfcStandMode;
      if (customization.nfcReadyMadeDesign) {
        details['Ready-Made Design'] = selectedReadyMadeStand?.name || customization.nfcReadyMadeDesign;
      }
      details['Step 2 - Back Shape'] = customization.nfcBackShape;
      details['Step 3 - Base'] = customization.nfcBase;
      details['Back Shape Color'] = customization.nfcBackShapeColor;
      details['Base Color'] = customization.nfcBaseColor;
      details['Social Icon Color'] = customization.nfcSocialIconColor;
      if (customization.nfcBusinessCardHolderColor) details['Business Card Holder Color'] = customization.nfcBusinessCardHolderColor;
      details['Icon Quantity'] = `${linkCount}`;
      customization.nfcIcons.slice(0, linkCount).forEach((icon, index) => {
        details[`Icon ${index + 1}`] = icon;
      });
      customization.nfcLinks.slice(0, linkCount).forEach((link, index) => {
        details[`Icon ${index + 1} URL`] = link;
      });
      if (customization.nfcBusinessName) details['Business Name'] = customization.nfcBusinessName;
      if (customization.nfcLogoUrl) details['Logo Upload'] = customization.nfcLogoUrl;
      if (customization.nfcQrCodeUrl) details['QR Code Upload'] = customization.nfcQrCodeUrl;
      if (customization.nfcDisplayInsertStyle) details['Display Insert Style'] = customization.nfcDisplayInsertStyle;
      if (customization.nfcDesignNotes) details['Design Notes / Special Requests'] = customization.nfcDesignNotes;
      if (customization.nfcAddOns.length) details['Selected NFC Stand Add-Ons'] = customization.nfcAddOns.join(', ');
      }
      details['NFC Accuracy Confirmation'] = 'NFC will be linked to the exact link(s) provided by customer. Customer must verify each link is correct.';
    } else if (isNfcKeychainProduct) {
      details['NFC Product Type'] = 'Custom NFC Keychain';
      if ((product?.customization_fields || []).length === 0) {
        details['Keychain Style'] = customization.nfcKeychainStyle;
        details['Primary Keychain Color'] = customization.nfcKeychainPrimaryColor;
        details['Secondary Keychain Color'] = customization.nfcKeychainSecondaryColor;
        details['Icon'] = customization.nfcKeychainIcon;
        details['URL to Program'] = customization.nfcKeychainUrl;
        if (customization.nfcKeychainBusinessName) details['Business Name'] = customization.nfcKeychainBusinessName;
        if (customization.nfcKeychainLogoUrl) details['Logo Upload'] = customization.nfcKeychainLogoUrl;
        if (customization.nfcKeychainQrCodeUrl) details['QR Code Upload'] = customization.nfcKeychainQrCodeUrl;
        if (customization.nfcKeychainResinFinish) details['Resin Finish'] = 'Yes (+$5.00)';
        if (customization.nfcKeychainNotes) details['Additional Notes'] = customization.nfcKeychainNotes;
      }
      details['NFC Accuracy Confirmation'] = 'NFC will be linked to the exact URL provided by customer. Customer must verify the link is correct.';
    }
    if (isNfcProduct) {
      const linkCount = Number(customization.nfcIconCount) || 1;
      if (!isGuidedNfcProduct) {
        details['NFC Link Count'] = `${linkCount}`;
        details['NFC Accuracy Confirmation'] = 'NFC will be linked to the exact link(s) provided by customer. Customer must verify each link is correct.';
        customization.nfcLinks.slice(0, linkCount).forEach((link, index) => {
          if (link) details[`NFC Icon ${index + 1} Link`] = link;
        });
      }
      details['QR Code Note'] = 'For Zelle, Venmo, Cash App, payment apps, social platforms, or QR-based setup, customer may need to send the QR code so Print Queen 3D can convert/use the correct link.';
    }
    return details;
  };

  const standAddOnPrices = {
    businessCardHolder: 10,
    squareReaderHolder: 15,
    glitterFinish: 5,
    matchingNfcKeychain: 10
  };
  const standAddOnTotal = customization.nfcAddOns.reduce((total, id) => total + (standAddOnPrices[id] || 0), 0)
    + (customization.nfcDisplayInsertStyle === 'Both Circle and Square +$5' ? 5 : 0);
  const productFieldAddOnTotal = (product?.customization_fields || []).reduce((total, field) => {
    const selectedValue = customization.productFieldValues?.[field.id];
    return total + getProductFieldAdjustment(field, selectedValue);
  }, 0);
  const addOnTotal = (customization.glitter ? 3 : 0)
    + (customization.resinOverlay ? 5 : 0)
    + (customization.nfcKeychainResinFinish ? 5 : 0)
    + standAddOnTotal
    + productFieldAddOnTotal
    + triColorAddOnPrice;
  const adjustedProduct = product && addOnTotal > 0
    ? { ...product, price: product.price + addOnTotal }
    : product;

  const validateGuidedNfcCustomization = () => {
    const missingCustomField = (product?.customization_fields || []).find((field) => (
      field.required && !customization.productFieldValues?.[field.id]
    ));
    if (missingCustomField) {
      toast.error(`Please complete ${missingCustomField.label || 'all required customization fields'}.`);
      return false;
    }
    const missingSingleColorRequest = (product?.customization_fields || []).find((field) => (
      field.type === 'filament_color' &&
      customization.productFieldValues?.[field.id] === 'Single Color Request' &&
      !customization.productFieldValues?.[`${field.id}_single_color`]
    ));
    if (missingSingleColorRequest) {
      toast.error(`Please enter the single color request for ${missingSingleColorRequest.label || 'your filament color'}.`);
      return false;
    }
    if (triColorSelectedField) {
      const missingTriChoice = !customization.productFieldValues?.[triColorSelectedField.id];
      if (missingTriChoice) {
        toast.error('Please choose your tri-color filament blend.');
        return false;
      }
      const allowedCompanions = TRI_COLOR_COMPANION_COLORS.map((color) => color.name);
      const invalidCompanion = filamentColorFields.find((field) => (
        field.id !== triColorSelectedField.id &&
        !allowedCompanions.includes(customization.productFieldValues?.[`${field.id}_single_color`] || '')
      ));
      if (invalidCompanion) {
        toast.error(`With the Tri-Color Filament Add-On, ${invalidCompanion.label || 'the second color'} must be White, Black, Gold, or Silver.`);
        return false;
      }
    }

    if (!isGuidedNfcProduct) return true;
    // Admin-defined fields replace the guided flow, so its steps are not required.
    if (hasProductCustomizationFields) return true;
    if (isNfcStandProduct) {
      if (!customization.nfcStandMode) {
        toast.error('Please choose Ready-Made Design or Build Your Own.');
        return false;
      }
      if (customization.nfcStandMode === 'Ready-Made Design' && !customization.nfcReadyMadeDesign) {
        toast.error('Please choose a ready-made stand design.');
        return false;
      }
      if (customization.nfcStandMode === 'Build Your Own') {
        if (!customization.nfcBackShape || !customization.nfcBase) {
          toast.error('Please choose your back shape and base.');
          return false;
        }
        if (customization.nfcBackShape === 'Custom Shape / Submit Inquiry') {
          toast.error('Custom shapes require a Custom Design Inquiry before checkout.');
          return false;
        }
      }
      if (!customization.nfcBackShapeColor || !customization.nfcBaseColor || !customization.nfcSocialIconColor) {
        toast.error('Please enter your back shape, base, and social icon colors.');
        return false;
      }
      if (hasBusinessCardHolderBase && !customization.nfcBusinessCardHolderColor) {
        toast.error('Please enter the business card holder color.');
        return false;
      }
      const linkCount = standIconCount;
      const missingIcon = customization.nfcIcons.slice(0, linkCount).some((icon) => !icon);
      const missingLink = customization.nfcLinks.slice(0, linkCount).some((link) => !link);
      if (missingIcon || missingLink) {
        toast.error('Please choose each icon and enter each URL.');
        return false;
      }
    }
    if (isNfcKeychainProduct) {
      if ((product?.customization_fields || []).length > 0) {
        return true;
      }
      if (!customization.nfcKeychainStyle || !customization.nfcKeychainPrimaryColor || !customization.nfcKeychainSecondaryColor || !customization.nfcKeychainIcon || !customization.nfcKeychainUrl) {
        toast.error('Please complete the keychain style, primary color, secondary color, icon, and URL.');
        return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (product) {
      if (!validateGuidedNfcCustomization()) return;
      const customizationDetails = buildCustomizationDetails();
      if (selectedColor) {
        customizationDetails.color = selectedColor;
      }
      if (Object.keys(selectedVariant).length > 0) {
        Object.assign(customizationDetails, selectedVariant);
      }
      
      addToCart(adjustedProduct, quantity, Object.keys(customizationDetails).length > 0 ? customizationDetails : null);
      
      // Get color name from hex
      const colorObj = COLORS.find(c => c.hex === selectedColor);
      const colorText = colorObj ? ` (${colorObj.name})` : '';
      toast.success(`${quantity} x ${product.name}${colorText} added to cart!`);
    }
  };

  const optionCard = (label, selected, onClick, description = '') => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition-all ${
        selected ? 'border-slate-950 bg-gradient-to-br from-cyan-50 via-white to-pink-50 shadow-lg ring-4 ring-cyan-200/70 scale-[1.01]' : 'border-gray-200 bg-white hover:border-blue-200'
      }`}
    >
      <span className="block font-bold text-gray-900">{label}</span>
      {description && <span className="mt-1 block text-sm text-gray-600">{description}</span>}
    </button>
  );

  const selectedColorCardClass = 'border-slate-950 bg-gradient-to-br from-cyan-50 via-white to-pink-50 shadow-lg ring-4 ring-cyan-200/70 scale-[1.01]';
  const unselectedColorCardClass = 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md';
  const selectedSwatchClass = 'ring-4 ring-slate-900/20 border-slate-900 shadow-lg';
  const selectedPill = (
    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">
      Selected
    </span>
  );

  const textInput = (label, field, placeholder = '') => (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input
        value={customization[field] || ''}
        onChange={(event) => updateCustomization(field, event.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </label>
  );

  const fileInput = (label, urlField, publicIdField, fileNameField, helper = '') => (
    <label className="block rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <span className="mb-1 block text-sm font-bold text-gray-900">{label}</span>
      {helper && <span className="mb-3 block text-sm text-gray-600">{helper}</span>}
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={(event) => uploadCustomizationImage(event.target.files?.[0], urlField, publicIdField, fileNameField)}
        className="w-full text-sm text-gray-700"
      />
      {uploadingField === urlField && <span className="mt-2 block text-sm font-semibold text-blue-700">Uploading...</span>}
      {customization[urlField] && (
        <a href={customization[urlField]} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-green-700 hover:underline">
          Uploaded: {customization[fileNameField] || 'View file'}
        </a>
      )}
    </label>
  );

  const getFieldOptionLabel = (option) => (
    typeof option === 'string' ? option : option?.label || option?.name || option?.value || ''
  );

  const getFieldOptionValue = (option) => (
    typeof option === 'string' ? option : option?.value || option?.label || option?.name || ''
  );

  const renderFilamentColorSelector = (field, value, label) => {
    const options = field.options || [];
    const singleColorFieldId = `${field.id}_single_color`;
    const colorGroupFieldId = `${field.id}_color_group`;
    const originalOption = options.find((option) => getFieldOptionLabel(option) === 'Original Printed Color') || 'Original Printed Color';
    const singleOption = options.find((option) => getFieldOptionLabel(option) === 'Single Color Request') || 'Single Color Request';
    const triColorOptions = options.filter((option) => {
      const optionLabel = getFieldOptionLabel(option);
      return optionLabel !== 'Original Printed Color' && optionLabel !== 'Single Color Request';
    });
    // Tri-color is offered on this field only when the admin has it enabled
    // (allow_tri_color) AND no OTHER color field already selected tri-color.
    const triSelectedElsewhere = Boolean(triColorSelectedField && triColorSelectedField.id !== field.id);
    const showTriColor = field.allow_tri_color !== false && triColorOptions.length > 0 && !triSelectedElsewhere;
    const fieldAddonPrice = Number(field.tri_color_addon_price ?? TRI_COLOR_ADDON_DEFAULT_PRICE);
    const storedGroup = customization.productFieldValues?.[colorGroupFieldId];
    const selectedGroup = storedGroup || (
      value === getFieldOptionValue(originalOption)
        ? 'original'
        : value === getFieldOptionValue(singleOption)
          ? 'single'
          : value
            ? 'tri_color'
            : ''
    );
    const mainOptions = [
      {
        id: 'original',
        label: field.original_color_label || 'Original Color',
        description: field.original_color_summary || 'Use the colors shown in the product photos.',
        swatchStyle: FILAMENT_SWATCH_STYLES['Original Printed Color'],
        onSelect: () => updateProductFields({
          [colorGroupFieldId]: 'original',
          [field.id]: getFieldOptionValue(originalOption),
          [singleColorFieldId]: ''
        })
      },
      {
        id: 'single',
        label: field.single_color_label || 'Single Color',
        description: field.single_color_summary || 'Choose one solid color from the color swatches.',
        swatchStyle: FILAMENT_SWATCH_STYLES['Single Color Request'],
        onSelect: () => updateProductFields({
          [colorGroupFieldId]: 'single',
          [field.id]: getFieldOptionValue(singleOption)
        })
      }
    ];

    if (showTriColor) {
      mainOptions.push({
        id: 'tri_color',
        label: field.tri_color_label || 'Tri-Color Filament Add-On',
        badge: `+$${fieldAddonPrice.toFixed(2)}`,
        description: field.tri_color_summary || 'Upgrade to a specialty three-color blend filament.',
        swatchStyle: { background: 'linear-gradient(135deg, #ec4899, #f59e0b, #22c55e, #3b82f6, #7c3aed)' },
        onSelect: () => updateProductFields({
          [colorGroupFieldId]: 'tri_color',
          [field.id]: triColorOptions.some((option) => getFieldOptionValue(option) === value) ? value : '',
          [singleColorFieldId]: ''
        })
      });
    }

    // When tri-color is chosen on another field, this field becomes the
    // companion color: only White, Black, Gold, or Silver are allowed.
    if (triSelectedElsewhere) {
      const companionValue = customization.productFieldValues?.[singleColorFieldId] || '';
      return (
        <div key={field.id} className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
          <p className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {field.tri_color_secondary_note || TRI_COLOR_SECONDARY_NOTE}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TRI_COLOR_COMPANION_COLORS.map((color) => {
              const isSelected = companionValue === color.name;
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => updateProductFields({
                    [colorGroupFieldId]: 'single',
                    [field.id]: 'Single Color Request',
                    [singleColorFieldId]: color.name
                  })}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    isSelected ? selectedColorCardClass : unselectedColorCardClass
                  }`}
                >
                  <span
                    className={`mx-auto mb-2 block h-10 w-10 rounded-full border border-gray-200 ${isSelected ? selectedSwatchClass : ''}`}
                    style={{ background: color.hex }}
                  />
                  <span className="block text-sm font-bold text-gray-900">{color.name}</span>
                  {isSelected && <span className="mt-2 block">{selectedPill}</span>}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div key={field.id} className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
        {field.helper && <span className="mb-3 block text-sm text-gray-600">{field.helper}</span>}
        <div className={`grid gap-3 ${showTriColor ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {mainOptions.map((option) => {
            const isSelected = selectedGroup === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={option.onSelect}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected ? selectedColorCardClass : unselectedColorCardClass
                }`}
              >
                <span className="mb-3 flex items-start justify-between gap-2">
                  <span className={`block h-10 w-10 rounded-full border border-gray-200 ${isSelected ? selectedSwatchClass : ''}`} style={option.swatchStyle} />
                  <span className="flex flex-col items-end gap-2">
                    {option.badge && (
                      <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-bold text-white shadow-sm">{option.badge}</span>
                    )}
                    {isSelected && selectedPill}
                  </span>
                </span>
                <span className="block text-base font-bold text-gray-900">{option.label}</span>
                <span className="mt-1 block text-xs text-gray-600">{option.description}</span>
              </button>
            );
          })}
        </div>
        {selectedGroup === 'original' && (
          <p className="mt-3 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {field.original_color_message || 'Your item will be printed using the colors shown in the product photos.'}
          </p>
        )}
        {selectedGroup === 'single' && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <ColorPicker
              label={field.single_color_label || 'Choose Single Color'}
              value={customization.productFieldValues?.[singleColorFieldId] || ''}
              onChange={(colorHex) => updateProductField(singleColorFieldId, colorHex)}
              dataTestId={`single-color-picker-${field.id}`}
            />
          </div>
        )}
        {showTriColor && selectedGroup === 'tri_color' && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="mb-3 rounded-lg border border-purple-100 bg-purple-50/70 px-4 py-3 text-sm leading-relaxed text-purple-900">
              {field.tri_color_explanation || TRI_COLOR_EXPLANATION}
            </p>
            <span className="mb-3 block text-sm font-semibold text-gray-700">{field.tri_color_picker_label || 'Choose Tri Color'}</span>
            <div className="grid sm:grid-cols-2 gap-3">
              {triColorOptions.map((option) => {
                const optionValue = getFieldOptionValue(option);
                const optionLabel = getFieldOptionLabel(option);
                const swatchStyle = option?.swatch_image
                  ? { backgroundImage: `url(${option.swatch_image})` }
                  : option?.swatch_style || FILAMENT_SWATCH_STYLES[optionLabel] || { background: option?.swatch_color || '#e5e7eb' };

                const isSelected = value === optionValue;
                return (
                  <button
                    key={optionValue}
                    type="button"
                    onClick={() => updateProductField(field.id, optionValue)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected ? selectedColorCardClass : unselectedColorCardClass
                    }`}
                  >
                    <span className={`h-10 w-10 shrink-0 rounded-full border border-gray-200 bg-cover bg-center ${isSelected ? selectedSwatchClass : ''}`} style={swatchStyle} />
                    <span className="min-w-0 flex-1 text-sm font-semibold text-gray-800">{optionLabel}</span>
                    {isSelected && selectedPill}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGuidedColorSelector = (label, valueField, required = true) => {
    const groupField = `${valueField}Group`;
    const singleColorField = `${valueField}SingleHex`;
    const value = customization[valueField] || '';
    const selectedGroup = customization[groupField] || (
      value === 'Original Printed Color'
        ? 'original'
        : value.startsWith('Single Color Request')
          ? 'single'
          : value.startsWith('Tri Color Filament')
            ? 'tri_color'
            : ''
    );
    const mainOptions = [
      {
        id: 'original',
        label: 'Original Color',
        description: 'Use the colors shown in the product photos.',
        swatchStyle: FILAMENT_SWATCH_STYLES['Original Printed Color'],
        onSelect: () => setCustomization((current) => ({
          ...current,
          [groupField]: 'original',
          [singleColorField]: '',
          [valueField]: 'Original Printed Color'
        }))
      },
      {
        id: 'single',
        label: 'Single Color',
        description: 'Choose one solid color from the swatches.',
        swatchStyle: FILAMENT_SWATCH_STYLES['Single Color Request'],
        onSelect: () => setCustomization((current) => ({
          ...current,
          [groupField]: 'single',
          [valueField]: ''
        }))
      },
      {
        id: 'tri_color',
        label: 'Tri Color',
        description: 'Choose one silky triple-color filament blend.',
        swatchStyle: { background: 'linear-gradient(135deg, #ec4899, #f59e0b, #22c55e, #3b82f6, #7c3aed)' },
        onSelect: () => setCustomization((current) => ({
          ...current,
          [groupField]: 'tri_color',
          [singleColorField]: '',
          [valueField]: current[groupField] === 'tri_color' ? current[valueField] : ''
        }))
      }
    ];

    return (
      <div className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-gray-700">{label}{required ? ' *' : ''}</span>
        <div className="grid sm:grid-cols-3 gap-3">
          {mainOptions.map((option) => {
            const isSelected = selectedGroup === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={option.onSelect}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected ? selectedColorCardClass : unselectedColorCardClass
                }`}
              >
                <span className="mb-3 flex items-start justify-between gap-2">
                  <span className={`block h-10 w-10 rounded-full border border-gray-200 ${isSelected ? selectedSwatchClass : ''}`} style={option.swatchStyle} />
                  {isSelected && selectedPill}
                </span>
                <span className="block text-base font-bold text-gray-900">{option.label}</span>
                <span className="mt-1 block text-xs text-gray-600">{option.description}</span>
              </button>
            );
          })}
        </div>
        {selectedGroup === 'original' && (
          <p className="mt-3 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            This part will be printed using the colors shown in the product photos when possible.
          </p>
        )}
        {selectedGroup === 'single' && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <ColorPicker
              label={`Choose ${label}`}
              value={customization[singleColorField] || ''}
              onChange={(colorHex) => {
                const selectedSingleColor = COLORS.find((color) => color.hex === colorHex);
                setCustomization((current) => ({
                  ...current,
                  [singleColorField]: colorHex,
                  [valueField]: selectedSingleColor ? `Single Color Request - ${selectedSingleColor.name} (${selectedSingleColor.hex})` : colorHex
                }));
              }}
              dataTestId={`guided-color-picker-${valueField}`}
            />
          </div>
        )}
        {selectedGroup === 'tri_color' && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <span className="mb-3 block text-sm font-semibold text-gray-700">Choose Tri Color</span>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.keys(FILAMENT_SWATCH_STYLES)
                .filter((option) => !['Original Printed Color', 'Single Color Request'].includes(option))
                .map((option) => {
                  const optionValue = `Tri Color Filament - ${option}`;
                  const isSelected = value === optionValue;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateCustomization(valueField, optionValue)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        isSelected ? selectedColorCardClass : unselectedColorCardClass
                      }`}
                    >
                      <span className={`h-10 w-10 shrink-0 rounded-full border border-gray-200 ${isSelected ? selectedSwatchClass : ''}`} style={FILAMENT_SWATCH_STYLES[option]} />
                      <span className="min-w-0 flex-1 text-sm font-semibold text-gray-800">{option}</span>
                      {isSelected && selectedPill}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProductCustomizationFields = () => {
    const fields = product?.customization_fields || [];
    if (fields.length === 0) return null;

    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{product?.product_page_section_title || 'Customize This Product'}</h2>
          <p className="text-gray-600">{product?.product_page_section_text || 'Complete the product options below before checkout.'}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((field) => {
            const value = customization.productFieldValues?.[field.id] || '';
            const label = `${field.label || field.id}${field.required ? ' *' : ''}`;
            const commonClass = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500";

            if (field.type === 'filament_color') {
              return renderFilamentColorSelector(field, value, label);
            }

            if (field.type === 'select') {
              const hasPriceAdjustments = field.price_adjustments && Object.keys(field.price_adjustments).length > 0;
              if (hasPriceAdjustments) {
                return (
                  <div key={field.id} className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {(field.options || []).map((option) => {
                        const optionValue = getFieldOptionValue(option);
                        const optionLabel = getFieldOptionLabel(option);
                        const optionPrice = getProductFieldOptionPrice(field, optionValue);
                        return (
                          <button
                            key={optionValue}
                            type="button"
                            onClick={() => updateProductField(field.id, optionValue)}
                            className={`rounded-xl border-2 bg-white p-4 text-left transition-all ${
                              value === optionValue ? 'border-blue-500 shadow-sm ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-200'
                            }`}
                          >
                            <span className="block text-lg font-bold text-gray-900">{optionLabel}</span>
                            <span className="mt-1 block text-2xl font-bold text-green-600">{formatPrice(optionPrice)}</span>
                          </button>
                        );
                      })}
                    </div>
                    {field.helper && <span className="mt-2 block text-xs text-gray-500">{field.helper}</span>}
                  </div>
                );
              }

              return (
                <label key={field.id} className="block">
                  <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
                  <select value={value} onChange={(event) => updateProductField(field.id, event.target.value)} className={commonClass}>
                    <option value="">{field.placeholder || `Choose ${field.label || field.id}`}</option>
                    {(field.options || []).map((option) => {
                      const optionValue = getFieldOptionValue(option);
                      const adjustment = Number(field.price_adjustments?.[optionValue] || 0);
                      return (
                        <option key={optionValue} value={optionValue}>
                          {getFieldOptionLabel(option)}{adjustment > 0 ? ` (+$${adjustment.toFixed(2)})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {field.helper && <span className="mt-1 block text-xs text-gray-500">{field.helper}</span>}
                </label>
              );
            }

            if (field.type === 'textarea') {
              return (
                <label key={field.id} className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
                  <textarea rows="3" value={value} onChange={(event) => updateProductField(field.id, event.target.value)} placeholder={field.placeholder || ''} className={commonClass} />
                  {field.helper && <span className="mt-1 block text-xs text-gray-500">{field.helper}</span>}
                </label>
              );
            }

            if (field.type === 'file') {
              const uploadKey = `product-field-${field.id}`;
              return (
                <label key={field.id} className="block rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <span className="mb-1 block text-sm font-bold text-gray-900">{label}</span>
                  {field.helper && <span className="mb-3 block text-sm text-gray-600">{field.helper}</span>}
                  <input
                    type="file"
                    accept={field.accept || 'image/png,image/jpeg,image/jpg'}
                    onChange={(event) => uploadProductFieldFile(event.target.files?.[0], field)}
                    className="w-full text-sm text-gray-700"
                  />
                  {uploadingField === uploadKey && <span className="mt-2 block text-sm font-semibold text-blue-700">Uploading...</span>}
                  {value && (
                    <a href={value} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-green-700 hover:underline">
                      Uploaded: {customization.productFieldValues?.[`${field.id}_file_name`] || 'View file'}
                    </a>
                  )}
                </label>
              );
            }

            if (field.type === 'checkbox') {
              const adjustment = getProductFieldAdjustment(field, true);
              return (
                <label key={field.id} className="block sm:col-span-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => updateProductField(field.id, event.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-sm font-bold text-gray-900">
                        {label}{adjustment > 0 ? ` (+$${adjustment.toFixed(2)})` : ''}
                      </span>
                      {field.helper && <span className="mt-1 block text-sm text-gray-600">{field.helper}</span>}
                    </span>
                  </span>
                </label>
              );
            }

            return (
              <label key={field.id} className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
                <input
                  type={field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={(event) => updateProductField(field.id, event.target.value)}
                  placeholder={field.placeholder || ''}
                  maxLength={field.max_length || undefined}
                  className={commonClass}
                />
                {field.helper && <span className="mt-1 block text-xs text-gray-500">{field.helper}</span>}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNfcStandCustomizer = () => {
    const linkCount = standIconCount;
    const standAddOns = [
      ['businessCardHolder', 'Business card holder +$10'],
      ['squareReaderHolder', 'Square Reader holder +$15'],
      ['glitterFinish', 'Glitter finish +$5'],
      ['matchingNfcKeychain', 'Matching NFC keychain +$10']
    ];

    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Your NFC Stand</h2>
          <p className="text-gray-600">Complete these steps before checkout so we have your colors, icons, links, logo, QR code, and layout notes.</p>
        </div>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Step 1 - Choose Your Stand</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {['Ready-Made Design', 'Build Your Own'].map((mode) => optionCard(
              mode,
              customization.nfcStandMode === mode,
              () => updateCustomization('nfcStandMode', mode),
              mode === 'Ready-Made Design' ? 'Choose from existing NFC stand designs.' : 'Choose every shape, base, color, icon, and link.'
            ))}
          </div>
          {customization.nfcStandMode === 'Ready-Made Design' && (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-gray-700">Available NFC Stand Designs</span>
              <select
                value={customization.nfcReadyMadeDesign}
                onChange={(event) => updateCustomization('nfcReadyMadeDesign', event.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an available NFC stand</option>
                {readyMadeStandOptions.map((stand) => (
                  <option key={stand.id} value={stand.id}>
                    {stand.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-sm text-gray-600">
                Choose one of the NFC stand products already available, then add your colors, icons, links, logo, and notes below.
              </span>
            </label>
          )}
        </section>

        {customization.nfcStandMode === 'Build Your Own' && (
          <>
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">Step 2 - Choose Backplate</h3>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">Backplate Shape</span>
                <select
                  value={customization.nfcBackShape}
                  onChange={(event) => updateCustomization('nfcBackShape', event.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose backplate shape</option>
                  {STAND_BACK_SHAPES.map((shape) => <option key={shape} value={shape}>{shape}</option>)}
                </select>
              </label>
              {customization.nfcBackShape === 'Custom Shape / Submit Inquiry' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-900">This design requires a custom quote. Please submit a Custom Design Inquiry with your inspiration photos, logo, preferred size, and details.</p>
                  <Link to="/design-your-own" className="inline-flex mt-3 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                    Start Custom Design Inquiry
                  </Link>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900">Step 3 - Choose Your Base</h3>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-gray-700">Base Style</span>
                <select
                  value={customization.nfcBase}
                  onChange={(event) => updateCustomization('nfcBase', event.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose base style</option>
                  {STAND_BASES.map((base) => <option key={base} value={base}>{base}</option>)}
                </select>
              </label>
            </section>
          </>
        )}

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Step 4 - Choose Your Colors</h3>
          <p className="text-sm text-gray-600">Choose original color, a single color swatch, or a silky tri-color filament for each part of your custom 3D print.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {renderGuidedColorSelector('Back Shape Color', 'nfcBackShapeColor')}
            {renderGuidedColorSelector('Base Color', 'nfcBaseColor')}
            {renderGuidedColorSelector('Social Icon Color', 'nfcSocialIconColor')}
            {hasBusinessCardHolderBase && renderGuidedColorSelector('Business Card Holder Color', 'nfcBusinessCardHolderColor')}
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Additional Requests / Small Details</span>
            <textarea
              rows="3"
              value={customization.nfcDesignNotes}
              onChange={(event) => updateCustomization('nfcDesignNotes', event.target.value)}
              placeholder="Add any small details, layout notes, icon order, QR placement, or special requests for this stand."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Step 5 - Choose Your Icons</h3>
          <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
            This stand includes {linkCount} NFC icon slot{linkCount === 1 ? '' : 's'} based on the selected design or base. Choose the icon{linkCount === 1 ? '' : 's'} you want below.
          </p>
          {linkCount > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: linkCount }).map((_, index) => (
                <label key={index} className="block">
                  <span className="mb-1 block text-sm font-semibold text-gray-700">Icon {index + 1}</span>
                  <select value={customization.nfcIcons[index] || ''} onChange={(event) => updateNfcIcon(index, event.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500">
                    <option value="">Choose icon</option>
                    {NFC_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              This selected base does not include NFC icon slots. Choose a base with NFC if you need icons and links.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Step 6 - Enter Your Links</h3>
          <p className="text-sm text-gray-600">Paste the website, payment link, social media link, booking page, menu, review page, or custom URL you want programmed to each NFC icon.</p>
          {linkCount > 0 ? (
            <div className="grid gap-3">
              {Array.from({ length: linkCount }).map((_, index) => (
                <input key={index} value={customization.nfcLinks[index] || ''} onChange={(event) => updateNfcLink(index, event.target.value)} placeholder={`Icon ${index + 1} URL`} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500" />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              No NFC links are needed for this base unless you choose a base with NFC slots.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Step 7 - Logo, QR Code & Display Insert</h3>
          {textInput('Business Name', 'nfcBusinessName', 'Your business name')}
          <div className="grid sm:grid-cols-2 gap-4">
            {fileInput('Upload High-Quality PNG Logo', 'nfcLogoUrl', 'nfcLogoPublicId', 'nfcLogoFileName', 'Please upload a high-quality PNG logo.')}
            {fileInput('Upload QR Code, optional', 'nfcQrCodeUrl', 'nfcQrCodePublicId', 'nfcQrCodeFileName', 'If you do not have a QR code, we can create one for you.')}
          </div>
          <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Custom logo design is not included with this listing. If you need a logo created from scratch, please submit a Custom Design Inquiry before ordering.</p>
          {displayInsertApplies && (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-gray-700">Display Insert Style</span>
              <select value={customization.nfcDisplayInsertStyle} onChange={(event) => updateCustomization('nfcDisplayInsertStyle', event.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500">
                <option value="">Choose display style</option>
                <option value="Circle">Circle</option>
                <option value="Square">Square</option>
                <option value="Both Circle and Square +$5">Both Circle and Square +$5</option>
              </select>
              <span className="mt-1 block text-sm text-gray-600">Some stands include a square or circle display area for your logo, QR code, or custom design. Choose which display style you want included.</span>
            </label>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Step 8 - Add-Ons</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {standAddOns.map(([id, label]) => (
              <label key={id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 font-semibold text-gray-800">
                <input type="checkbox" checked={customization.nfcAddOns.includes(id)} onChange={() => toggleNfcAddOn(id)} className="h-4 w-4" />
                {label}
              </label>
            ))}
            {['NFC programming Included', 'QR code creation Included'].map((label) => (
              <div key={label} className="rounded-lg border border-green-100 bg-green-50 p-3 font-semibold text-green-800">{label}</div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderNfcKeychainCustomizer = () => (
    (product?.customization_fields || []).length > 0 ? renderProductCustomizationFields() : (
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Your NFC Keychain</h2>
        <p className="text-gray-600">Choose your keychain style, color, icon, URL, logo or QR file, and any final notes before checkout.</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Step 1 - Choose Keychain Style</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(product.images || []).map((image, index) => {
            const label = `${product.name} Style ${index + 1}`;
            return (
              <button key={label} type="button" onClick={() => updateCustomization('nfcKeychainStyle', label)} className={`rounded-xl overflow-hidden border-2 bg-white text-left ${customization.nfcKeychainStyle === label ? 'border-blue-500' : 'border-gray-200'}`}>
                <img src={image} alt={label} className="h-28 w-full object-cover" />
                <span className="block p-2 text-sm font-semibold text-gray-800">{label}</span>
              </button>
            );
          })}
          {optionCard('Custom NFC Keychain Style', customization.nfcKeychainStyle === 'Custom NFC Keychain Style', () => updateCustomization('nfcKeychainStyle', 'Custom NFC Keychain Style'))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Step 2 - Keychain Colors</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {textInput('Primary Keychain Color', 'nfcKeychainPrimaryColor', 'Example: black, white, teal, rose pink, orange, gold, silver, etc.')}
          {textInput('Secondary Keychain Color', 'nfcKeychainSecondaryColor', 'Example: white, teal, pink, gold, silver, purple, etc.')}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Step 3 - Choose Icon</h3>
        <select value={customization.nfcKeychainIcon} onChange={(event) => updateCustomization('nfcKeychainIcon', event.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500">
          <option value="">Choose icon</option>
          {NFC_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
        </select>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Step 4 - Enter URL</h3>
        {textInput('URL to Program', 'nfcKeychainUrl', 'Paste your website, payment link, social media link, review page, booking page, or custom URL')}
        <p className="text-sm text-gray-600">Paste the website, payment link, social media link, review page, booking page, or custom URL you want programmed to your NFC keychain.</p>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Step 5 - Logo / QR Code Customization</h3>
        {textInput('Business Name', 'nfcKeychainBusinessName', 'Your business name')}
        <div className="grid sm:grid-cols-2 gap-4">
          {fileInput('Upload Logo PNG', 'nfcKeychainLogoUrl', 'nfcKeychainLogoPublicId', 'nfcKeychainLogoFileName', 'If your keychain includes a custom logo, please upload a high-quality PNG file.')}
          {fileInput('Upload QR Code PNG', 'nfcKeychainQrCodeUrl', 'nfcKeychainQrCodePublicId', 'nfcKeychainQrCodeFileName', 'If your keychain includes a QR code, please upload a high-quality PNG file.')}
        </div>
        <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold text-amber-900">If you need a logo designed from scratch, please submit a Custom Design Inquiry before ordering.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Step 6 - Optional Add-On</h3>
        <label className="flex items-center gap-3 rounded-lg border border-purple-100 bg-purple-50 p-3 font-semibold text-purple-800">
          <input type="checkbox" checked={customization.nfcKeychainResinFinish} onChange={(event) => updateCustomization('nfcKeychainResinFinish', event.target.checked)} className="h-4 w-4" />
          Add Resin Finish +$5
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Step 7 - Additional Notes</h3>
        <textarea rows="4" value={customization.nfcKeychainNotes} onChange={(event) => updateCustomization('nfcKeychainNotes', event.target.value)} placeholder="Tell us anything else you want included on your NFC keychain." className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500" />
      </section>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="grid md:grid-cols-2 gap-12">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-10 w-1/4" />
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Product not found</h2>
          <Button onClick={() => navigate('/products')} className="btn-primary">
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" data-testid="product-detail-page">
      <Navbar />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        <Button
          onClick={() => navigate('/products')}
          variant="ghost"
          className="mb-8 flex items-center space-x-2"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Products</span>
        </Button>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Images */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl overflow-hidden h-96 flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={displayProductName}
                  className="w-full h-full object-cover"
                  data-testid="product-main-image"
                />
              ) : (
                <Package className="h-32 w-32 text-gray-300" />
              )}
            </div>
            {sameCategoryGalleryItems.length > 0 && (
              <div className="hidden md:block space-y-4">
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-bold text-gray-900">More From This Collection</h2>
                  <p className="text-sm text-gray-600">
                    Browse more product photos from this collection while you customize.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {sameCategoryGalleryItems.map((item, index) => {
                    const galleryCard = (
                      <div
                        className={`glass-card rounded-2xl overflow-hidden h-96 bg-gradient-to-br from-blue-50 to-green-50 ${
                          item.type === 'image' && selectedImage === item.imageIndex ? 'ring-4 ring-blue-500' : ''
                        }`}
                      >
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    );

                    return item.type === 'reference' ? (
                      <div
                        key={item.id}
                        className="group block text-left"
                        data-testid={`same-category-product-${index}`}
                      >
                        {galleryCard}
                        <div className="mt-3 text-center md:text-left">
                          <p className="font-semibold text-gray-900">
                            {item.title}
                          </p>
                          {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
                        </div>
                      </div>
                    ) : (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedImage(item.imageIndex)}
                        className="block w-full text-left"
                        data-testid={`product-gallery-image-${index}`}
                      >
                        {galleryCard}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Material Details (if available) */}
            {product.material_details && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Material Details</h3>
                </div>
                <p className="text-sm text-gray-700">{product.material_details}</p>
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                  {product.category}
                </span>
                {/* Fulfillment Badges */}
                {product.pickup_only ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full">
                    <MapPin className="h-3.5 w-3.5" />
                    Pickup Only
                  </span>
                ) : product.available_for_pickup === false ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full">
                    <Truck className="h-3.5 w-3.5" />
                    Shipping Only
                  </span>
                ) : product.available_for_pickup && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full">
                    <MapPin className="h-3.5 w-3.5" />
                    Pickup Available
                  </span>
                )}
                {product.badge && product.sale_badge_enabled !== false && (
                  <span
                    className="inline-block px-3 py-1 text-sm font-semibold text-white rounded-full"
                    style={{ backgroundColor: product.badge_color || '#dc2626' }}
                  >
                    {product.badge}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="product-title">{displayProductName}</h1>
              {displayProductSubtitle && <p className="text-lg font-bold text-blue-700 mb-3">{displayProductSubtitle}</p>}
              <div className="space-y-1" data-testid="product-price">
                {hasComparePrice && !isNfcStandProduct && (
                  <p className="text-lg font-semibold text-gray-400 line-through">
                    {formatPrice(product.compare_at_price, product.compare_at_price_prefix)}
                  </p>
                )}
                <p className="text-3xl font-bold text-green-600">
                  {isNfcStandProduct
                    ? formatPrice(29.99 + addOnTotal, 'Starting at')
                    : formatPrice(adjustedProduct?.price || product.price, product.price_prefix)}
                </p>
              </div>
              {addOnTotal > 0 && (
                <p className="text-sm font-semibold text-blue-700 mt-1">Includes selected options (+${addOnTotal.toFixed(2)})</p>
              )}
            </div>

            {isCustomizableProduct(product) && (
              <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100 rounded-xl p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-2">✨ Made Just for You</h2>
                <p className="text-gray-700">
                  Personalize this item with your name, logo, colors, photo, QR code, NFC chip, message, or custom design.
                </p>
              </div>
            )}

            <p className="text-gray-600 text-lg" data-testid="product-description">{displayProductDescription}</p>

            {!isGuidedNfcProduct && (product.product_page_section_title || product.product_page_section_text || (product.platform_options || []).length > 0 || (product.add_on_options || []).length > 0 || (product.bundle_options || []).length > 0) && (
              <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm space-y-5">
                {(product.product_page_section_title || product.product_page_section_text) && (
                  <div>
                    {product.product_page_section_title && (
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.product_page_section_title}</h2>
                    )}
                    {product.product_page_section_text && (
                      <p className="text-gray-600 leading-relaxed">{product.product_page_section_text}</p>
                    )}
                  </div>
                )}

                {(product.platform_options || []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 mb-3">Platform Options</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.platform_options.map((option) => (
                        <span key={option} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.product_page_note && (
                  <p className="rounded-xl bg-green-50 border border-green-100 p-4 text-sm font-semibold text-green-800">
                    {product.product_page_note}
                  </p>
                )}

                {(product.add_on_options || []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">Add-On Pricing</h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {product.add_on_options.map((addOn) => (
                        <div key={addOn.name || addOn.label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                          <span className="font-medium text-gray-700">{addOn.name || addOn.label}</span>
                          <span className="font-bold text-green-700">{addOn.price_label || addOn.label || (Number(addOn.price || 0) > 0 ? `+$${Number(addOn.price).toFixed(2)}` : 'Included')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(product.bundle_options || []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">Business Bundles</h3>
                    <div className="grid gap-3">
                      {product.bundle_options.map((bundle) => (
                        <div key={bundle.name} className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-green-50 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-bold text-gray-900">{bundle.name}</h4>
                            <span className="font-bold text-green-700">{bundle.price_label || formatPrice(bundle.price)}</span>
                          </div>
                          {(bundle.includes || []).length > 0 && (
                            <ul className="mt-3 space-y-1 text-sm text-gray-700">
                              {bundle.includes.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {/* Production Time */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold text-gray-900">Production Time</h3>
                </div>
                <p className="text-sm text-gray-700">
                  {product.estimated_prep_time 
                    ? `${product.estimated_prep_time} hours` 
                    : '3-5 days'}
                </p>
              </div>

              {/* Fulfillment Info */}
              <div className={`rounded-lg p-4 ${
                product.pickup_only 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {product.pickup_only ? (
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  )}
                  <h3 className="font-semibold text-gray-900">
                    {product.pickup_only ? 'In-Store Pickup' : 'Fulfillment'}
                  </h3>
                </div>
                <p className="text-sm text-gray-700">
                  {product.pickup_only 
                    ? 'This item is available for in-store pickup only'
                    : product.available_for_pickup === false
                      ? 'Ships after print is made and passes quality checks'
                      : 'Ship to you or pickup in-store'
                  }
                </p>
              </div>
            </div>

            {/* Color Picker — hidden when the product has its own customization fields (color is chosen there instead) */}
            {showColorPicker && !isNfcStandProduct && !isKeychainOrNecklace && !hasProductCustomizationFields && (
              <ColorPicker
                label="Choose Color"
                value={selectedColor}
                onChange={setSelectedColor}
                dataTestId="product-color-picker"
              />
            )}

            {/* Admin-defined customization fields are the source of truth for every
                product. The guided NFC flows below are fallbacks used ONLY when a
                product has no customization_fields configured in the admin editor. */}
            {isNfcStandProduct && !hasProductCustomizationFields && renderNfcStandCustomizer()}
            {isNfcKeychainProduct && !hasProductCustomizationFields && renderNfcKeychainCustomizer()}
            {hasProductCustomizationFields && renderProductCustomizationFields()}

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              {fileInput(
                'Optional photo inspiration or reference image',
                'inspirationImageUrl',
                'inspirationPublicId',
                'inspirationFileName',
                'Attach a photo, inspiration image, logo, sketch, or reference picture if it helps explain this product customization.'
              )}
            </div>

            {isCustomizable && (
              <p className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
                Policy: Personalized items are custom-made and are final sale once production begins.
              </p>
            )}

            {isCustomizable && !isGuidedNfcProduct && !hasProductCustomizationFields && (
              <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Personalize This 3D Printed Item</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Every personalized item is professionally 3D printed. Common materials include PLA filament, PETG filament, and resin when needed. Acrylic is only available for custom creations when the project allows it.
                  </p>
                </div>

                <textarea
                  rows="3"
                  value={customization.personalizationDetails}
                  onChange={(event) => updateCustomization('personalizationDetails', event.target.value)}
                  placeholder="Names, logo details, text, colors, theme, size notes, or special ideas"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    value={customization.productColor}
                    onChange={(event) => updateCustomization('productColor', event.target.value)}
                    placeholder="Requested product color"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={customization.materialRequest}
                    onChange={(event) => updateCustomization('materialRequest', event.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Material request, if any</option>
                    <option value="PLA Filament">PLA Filament</option>
                    <option value="PETG Filament">PETG Filament</option>
                    <option value="Resin if needed">Resin if needed</option>
                  </select>
                </div>

                <label className="flex items-center justify-center gap-2 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700">
                  <input
                    type="checkbox"
                    checked={customization.resinOverlay}
                    onChange={(event) => updateCustomization('resinOverlay', event.target.checked)}
                    className="h-4 w-4 rounded border-purple-300"
                  />
                  Add resin overlay +$5
                </label>

                {isKeychainOrNecklace && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      value={customization.keychainColor}
                      onChange={(event) => updateCustomization('keychainColor', event.target.value)}
                      placeholder="Primary keychain or necklace color"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      value={customization.keychainSecondaryColor}
                      onChange={(event) => updateCustomization('keychainSecondaryColor', event.target.value)}
                      placeholder="Secondary keychain or necklace color"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {isPendantOrChain && (
                  <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
                    <input
                      value={customization.chainColor}
                      onChange={(event) => updateCustomization('chainColor', event.target.value)}
                      placeholder="Pendant or custom chain color"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                      <input
                        type="checkbox"
                        checked={customization.glitter}
                        onChange={(event) => updateCustomization('glitter', event.target.checked)}
                        className="h-4 w-4 rounded border-blue-300"
                      />
                      Add glitter +$3
                    </label>
                  </div>
                )}

                {isLithophaneOrPhoto && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">
                      Photo required: please email the photo/reference image to printqueen3d@gmail.com after ordering so we can create your lithophane or photo item.
                    </p>
                    <textarea
                      rows="2"
                      value={customization.photoInstructions}
                      onChange={(event) => updateCustomization('photoInstructions', event.target.value)}
                      placeholder="Photo notes, orientation, names, or message"
                      className="mt-3 w-full px-4 py-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                )}

                {isNfcProduct && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        NFC will be linked to the exact link you provide, so please make sure every link is correct before submitting.
                      </p>
                      <p className="text-xs text-blue-700 mt-2">
                        For Zelle, Venmo, Cash App, social platforms, websites, payment links, or QR displays, send the QR code if needed so we can turn/use it correctly.
                      </p>
                    </div>
                    <select
                      value={customization.nfcIconCount}
                      onChange={(event) => updateCustomization('nfcIconCount', event.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="1">1 icon / 1 link</option>
                      <option value="2">2 icons / 2 links</option>
                      <option value="3">3 icons / 3 links</option>
                    </select>
                    <div className="grid gap-3">
                      {Array.from({ length: Number(customization.nfcIconCount) || 1 }).map((_, index) => (
                        <input
                          key={index}
                          value={customization.nfcLinks[index] || ''}
                          onChange={(event) => updateNfcLink(index, event.target.value)}
                          placeholder={`Icon ${index + 1} platform and link, e.g. Instagram, website, Zelle, Venmo, Cash App`}
                          className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Options</h3>
                {product.variants.map((variant, index) => (
                  <div key={index} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{variant.name}</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => setSelectedVariant({ ...selectedVariant, [variant.name]: e.target.value })}
                      data-testid={`variant-${variant.name}`}
                    >
                      <option value="">Select {variant.name}</option>
                      <option value={variant.value}>
                        {variant.value}
                        {variant.price_adjustment > 0 && ` (+$${variant.price_adjustment.toFixed(2)})`}
                      </option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity - Only show for non-custom products */}
            {!product.custom_builder && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="decrease-quantity"
                  >
                    -
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center" data-testid="quantity-value">{quantity}</span>
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(product.stock > 0 ? Math.min(product.stock, quantity + 1) : quantity + 1)}
                    disabled={product.stock > 0 ? quantity >= product.stock : false}
                    data-testid="increase-quantity"
                  >
                    +
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  {product.stock > 0 ? `${product.stock} available` : isCustomizable ? 'Made to order' : 'Out of stock'}
                </p>
              </div>
            )}

            {/* Add to Cart or Customize Button */}
            {product.custom_builder ? (
              <Button
                onClick={() => {
                  const builderElement = document.getElementById('custom-builder-section');
                  if (builderElement) {
                    builderElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="w-full btn-primary text-lg py-6"
                data-testid="customize-button"
              >
                Customize Your Stand
              </Button>
            ) : (
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0 && !isCustomizable}
                className="w-full btn-primary text-lg py-6"
                data-testid="add-to-cart-button"
              >
                {product.stock === 0 && !isCustomizable ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            )}
          </motion.div>
        </div>

        {/* Custom Builder Component */}
        {product.custom_builder === 'nfc-stand-builder' && (
          <div id="custom-builder-section" className="mt-12 scroll-mt-24">
            <BuildYourStand product={product} />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 pt-8 border-t border-gray-200"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/products/${relatedProduct.id}`}
                  className="group product-card rounded-xl overflow-hidden hover:scale-105 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                    <img
                      src={relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0] : 'https://via.placeholder.com/400'}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {relatedProduct.badge && relatedProduct.sale_badge_enabled !== false && (
                      <div
                        className="absolute top-2 right-2 text-white px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: relatedProduct.badge_color || '#dc2626' }}
                      >
                        {relatedProduct.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{relatedProduct.name}</h3>
                    {Number(relatedProduct.compare_at_price) > Number(relatedProduct.price || 0) && (
                      <p className="text-sm font-semibold text-gray-400 line-through">
                        {formatPrice(relatedProduct.compare_at_price, relatedProduct.compare_at_price_prefix)}
                      </p>
                    )}
                    <p className="text-lg font-bold text-green-600">{formatPrice(relatedProduct.price, relatedProduct.price_prefix)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
