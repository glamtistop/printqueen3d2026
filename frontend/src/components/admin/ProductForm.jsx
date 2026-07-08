import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ImageUploader } from './ImageUploader';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  MapPin,
  Truck,
  Clock,
  AlertCircle,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  Wand2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FILAMENT_COLOR_FIELD_TEMPLATE = {
  id: 'filament_color',
  label: 'Filament Color',
  type: 'filament_color',
  required: true,
  helper: 'Choose the filament color option you would like for this made-to-order 3D print.',
  options: [
    'Original Printed Color',
    'Single Color Request',
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
  ],
  single_color_label: 'Single Color Request',
  single_color_placeholder: 'Example:\\nMatte Black\\nWhite\\nTeal\\nGold\\nSilver\\nOrange\\nPink\\nPurple\\nRed\\nBlue',
  original_color_message: 'Your item will be printed using the colors shown in the product photos.'
};

export const ProductForm = ({ product, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    price: '',
    price_prefix: '',
    compare_at_price: '',
    compare_at_price_prefix: '',
    category: '',
    stock: 0,
    images: [],
    image_alt: '',
    published: true,
    collection_ids: [],
    variants: [],
    badge: '',
    badge_color: '#dc2626',
    sale_badge_enabled: true,
    available_colors: [],
    material_details: '',
    custom_builder: '',
    platform_options: [],
    add_on_options: [],
    bundle_options: [],
    customization_fields: [],
    product_page_section_title: '',
    product_page_section_text: '',
    product_page_note: '',
    // Pickup settings
    available_for_pickup: true,
    pickup_only: false,
    pickup_location_ids: [],
    estimated_prep_time: ''
  });
  const [collections, setCollections] = useState([]);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [customBuilders, setCustomBuilders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [showPickupSettings, setShowPickupSettings] = useState(false);
  const [addOnOptionsJson, setAddOnOptionsJson] = useState('[]');
  const [bundleOptionsJson, setBundleOptionsJson] = useState('[]');
  const [customizationFieldsJson, setCustomizationFieldsJson] = useState('[]');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        subtitle: product.subtitle || '',
        description: product.description || '',
        price: product.price || '',
        price_prefix: product.price_prefix || '',
        compare_at_price: product.compare_at_price || '',
        compare_at_price_prefix: product.compare_at_price_prefix || '',
        category: product.category || '',
        stock: product.stock || '',
        images: product.images || [],
        image_alt: product.image_alt || '',
        published: product.published !== undefined ? product.published : true,
        collection_ids: product.collection_ids || [],
        variants: product.variants || [],
        badge: product.badge || '',
        badge_color: product.badge_color || '#dc2626',
        sale_badge_enabled: product.sale_badge_enabled !== undefined ? product.sale_badge_enabled : true,
        available_colors: product.available_colors || [],
        material_details: product.material_details || '',
        custom_builder: product.custom_builder || '',
        platform_options: product.platform_options || [],
        add_on_options: product.add_on_options || [],
        bundle_options: product.bundle_options || [],
        customization_fields: product.customization_fields || [],
        product_page_section_title: product.product_page_section_title || '',
        product_page_section_text: product.product_page_section_text || '',
        product_page_note: product.product_page_note || '',
        // Pickup settings
        available_for_pickup: product.available_for_pickup !== undefined ? product.available_for_pickup : true,
        pickup_only: product.pickup_only || false,
        pickup_location_ids: product.pickup_location_ids || [],
        estimated_prep_time: product.estimated_prep_time || ''
      });
      setAddOnOptionsJson(JSON.stringify(product.add_on_options || [], null, 2));
      setBundleOptionsJson(JSON.stringify(product.bundle_options || [], null, 2));
      setCustomizationFieldsJson(JSON.stringify(product.customization_fields || [], null, 2));
      // Show pickup settings if there are any non-default settings
      if (product.pickup_only || (product.pickup_location_ids && product.pickup_location_ids.length > 0) || !product.available_for_pickup) {
        setShowPickupSettings(true);
      }
    }
    fetchCollections();
    fetchPickupLocations();
    fetchCustomBuilders();
  }, [product]);

  const fetchCollections = async () => {
    setCollectionsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/collections`);
      setCollections(response.data || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      toast.error('Collections did not load. Please try reopening the product form.');
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const fetchPickupLocations = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/pickup-locations`, {
        withCredentials: true
      });
      setPickupLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch pickup locations:', error);
    }
  };

  const fetchCustomBuilders = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/custom-builders`);
      setCustomBuilders(response.data);
    } catch (error) {
      console.error('Failed to fetch custom builders:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedCollection = collections.find((collection) => collection.id === formData.collection_ids[0]);
      if (!selectedCollection) {
        toast.error('Please choose which collection this product belongs to.');
        setLoading(false);
        return;
      }

      let parsedAddOns = [];
      let parsedBundles = [];
      let parsedCustomizationFields = [];
      try {
        parsedAddOns = addOnOptionsJson ? JSON.parse(addOnOptionsJson) : [];
        parsedBundles = bundleOptionsJson ? JSON.parse(bundleOptionsJson) : [];
        parsedCustomizationFields = customizationFieldsJson ? JSON.parse(customizationFieldsJson) : [];
      } catch (parseError) {
        toast.error('Add-ons, bundles, or customization fields JSON is not valid.');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        category: selectedCollection.name,
        collection_ids: [selectedCollection.id],
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        platform_options: Array.isArray(formData.platform_options) ? formData.platform_options : [],
        add_on_options: parsedAddOns,
        bundle_options: parsedBundles,
        customization_fields: parsedCustomizationFields,
        stock: parseInt(formData.stock) || 0,
        estimated_prep_time: formData.estimated_prep_time ? parseInt(formData.estimated_prep_time) : null
      };

      if (product) {
        await axios.put(
          `${BACKEND_URL}/api/products/${product.id}`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${BACKEND_URL}/api/products`,
          payload,
          { withCredentials: true }
        );
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleImagesUploaded = (images) => {
    setFormData({ ...formData, images });
  };

  const togglePickupLocation = (locationId) => {
    setFormData(prev => {
      const currentIds = prev.pickup_location_ids || [];
      if (currentIds.includes(locationId)) {
        return { ...prev, pickup_location_ids: currentIds.filter(id => id !== locationId) };
      } else {
        return { ...prev, pickup_location_ids: [...currentIds, locationId] };
      }
    });
  };

  const selectAllLocations = () => {
    setFormData(prev => ({
      ...prev,
      pickup_location_ids: pickupLocations.map(loc => loc.id)
    }));
  };

  const clearAllLocations = () => {
    setFormData(prev => ({ ...prev, pickup_location_ids: [] }));
  };

  const handlePrimaryCollectionChange = (collectionId) => {
    const selectedCollection = collections.find((collection) => collection.id === collectionId);
    setFormData({
      ...formData,
      collection_ids: collectionId ? [collectionId] : [],
      category: selectedCollection?.name || ''
    });
  };

  const insertFilamentColorSelector = () => {
    try {
      const fields = customizationFieldsJson ? JSON.parse(customizationFieldsJson) : [];
      const nextId = fields.some((field) => field.id === FILAMENT_COLOR_FIELD_TEMPLATE.id)
        ? `filament_color_${fields.length + 1}`
        : FILAMENT_COLOR_FIELD_TEMPLATE.id;
      const nextFields = [
        ...fields,
        { ...FILAMENT_COLOR_FIELD_TEMPLATE, id: nextId }
      ];
      setCustomizationFieldsJson(JSON.stringify(nextFields, null, 2));
      toast.success('Filament color selector added');
    } catch (error) {
      toast.error('Customization fields JSON must be valid before adding the filament selector.');
    }
  };

  const getCustomizationFields = () => {
    try {
      const parsed = customizationFieldsJson ? JSON.parse(customizationFieldsJson) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeCustomizationFields = (fields) => {
    setCustomizationFieldsJson(JSON.stringify(fields, null, 2));
  };

  const createCustomizationField = (type) => {
    const fields = getCustomizationFields();
    const nextNumber = fields.length + 1;
    const defaultsByType = {
      text: {
        id: `text_field_${nextNumber}`,
        label: 'New Text Field',
        type: 'text',
        required: false,
        placeholder: ''
      },
      textarea: {
        id: `textarea_field_${nextNumber}`,
        label: 'New Text Area',
        type: 'textarea',
        required: false,
        placeholder: ''
      },
      select: {
        id: `dropdown_field_${nextNumber}`,
        label: 'New Dropdown',
        type: 'select',
        required: false,
        options: ['Option 1', 'Option 2']
      },
      file: {
        id: `upload_field_${nextNumber}`,
        label: 'Upload File',
        type: 'file',
        required: false,
        helper: 'Upload an image, logo, or reference file.'
      },
      filament_color: {
        ...FILAMENT_COLOR_FIELD_TEMPLATE,
        id: `color_field_${nextNumber}`,
        label: 'Color Option'
      }
    };
    writeCustomizationFields([...fields, defaultsByType[type]]);
  };

  const updateCustomizationField = (index, key, value) => {
    const fields = getCustomizationFields();
    const nextFields = fields.map((field, fieldIndex) => (
      fieldIndex === index ? { ...field, [key]: value } : field
    ));
    writeCustomizationFields(nextFields);
  };

  const updateCustomizationFieldOptions = (index, value) => {
    updateCustomizationField(
      index,
      'options',
      value.split('\n').map((option) => option.trim()).filter(Boolean)
    );
  };

  const removeCustomizationField = (index) => {
    writeCustomizationFields(getCustomizationFields().filter((_, fieldIndex) => fieldIndex !== index));
  };

  const moveCustomizationField = (index, direction) => {
    const fields = getCustomizationFields();
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) return;
    const nextFields = [...fields];
    [nextFields[index], nextFields[nextIndex]] = [nextFields[nextIndex], nextFields[index]];
    writeCustomizationFields(nextFields);
  };

  const customizationFields = getCustomizationFields();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g., 2 Icon NFC Stand"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Choose Product Collection *
            </label>
            <select
              value={formData.collection_ids[0] || ''}
              onChange={(e) => handlePrimaryCollectionChange(e.target.value)}
              className="w-full px-3 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
              disabled={collectionsLoading || collections.length === 0}
            >
              <option value="">
                {collectionsLoading
                  ? 'Loading collections...'
                  : collections.length === 0
                    ? 'No collections found'
                    : 'Choose the collection for this product'}
              </option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-2">
              This is where the product will show on the website.
            </p>
            {collections.length === 0 && !collectionsLoading && (
              <p className="mt-2 text-sm font-semibold text-amber-700">
                No collections loaded. Create a collection first, then reopen this product form.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale / Current Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original / Compare Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.compare_at_price}
                onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                placeholder="e.g., 39.99"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Price Prefix
              </label>
              <input
                type="text"
                value={formData.price_prefix}
                onChange={(e) => setFormData({ ...formData, price_prefix: e.target.value })}
                placeholder="e.g., Starting at"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price Prefix
              </label>
              <input
                type="text"
                value={formData.compare_at_price_prefix}
                onChange={(e) => setFormData({ ...formData, compare_at_price_prefix: e.target.value })}
                placeholder="e.g., Starting at"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0 for made-to-order"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave as 0 for made-to-order items</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material Details (Optional)
            </label>
            <textarea
              value={formData.material_details}
              onChange={(e) => setFormData({ ...formData, material_details: e.target.value })}
              placeholder="e.g., Quality PLA or PETG, precision 3D printed, finished with care"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Describe the materials used. Leave empty to hide from product page.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Badge Text (Optional)
            </label>
            <input
              type="text"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              placeholder="e.g., New, Sale, Popular, Customizable"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Displayed as a badge on product card</p>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge Color
              </label>
              <input
                type="text"
                value={formData.badge_color}
                onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                placeholder="#dc2626"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              <input
                type="checkbox"
                checked={formData.sale_badge_enabled}
                onChange={(e) => setFormData({ ...formData, sale_badge_enabled: e.target.checked })}
                className="h-4 w-4 rounded border-red-300"
              />
              Show Sale Badge
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="enable-colors"
              checked={formData.available_colors.length > 0}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  available_colors: e.target.checked ? ['enabled'] : [] 
                });
              }}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enable-colors" className="text-sm font-medium text-gray-700 cursor-pointer">
              Enable Color Selection for Customers
            </label>
          </div>
          <p className="text-xs text-gray-500 -mt-2 pl-4">Customers can choose from 32 premium colors when this is enabled</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-purple-500" />
              Custom Builder (Optional)
            </label>
            <select
              value={formData.custom_builder}
              onChange={(e) => setFormData({ ...formData, custom_builder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None - Standard Product Page</option>
              {customBuilders.map((builder) => (
                <option key={builder.id} value={builder.slug}>
                  {builder.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Add custom builder component for product customization</p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Custom Product Page Section</h3>
            <input
              type="text"
              value={formData.product_page_section_title}
              onChange={(e) => setFormData({ ...formData, product_page_section_title: e.target.value })}
              placeholder="Customize Your NFC Stand"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <textarea
              value={formData.product_page_section_text}
              onChange={(e) => setFormData({ ...formData, product_page_section_text: e.target.value })}
              rows={3}
              placeholder="Section description"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <textarea
              value={formData.platform_options.join('\n')}
              onChange={(e) => setFormData({ ...formData, platform_options: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}
              rows={5}
              placeholder="One platform option per line"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <textarea
              value={formData.product_page_note}
              onChange={(e) => setFormData({ ...formData, product_page_note: e.target.value })}
              rows={2}
              placeholder="Product page note"
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add-ons JSON</label>
                <textarea
                  value={addOnOptionsJson}
                  onChange={(e) => setAddOnOptionsJson(e.target.value)}
                  rows={7}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bundles JSON</label>
                <textarea
                  value={bundleOptionsJson}
                  onChange={(e) => setBundleOptionsJson(e.target.value)}
                  rows={7}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Customization Fields</label>
                  <p className="text-xs text-gray-500">Add, rename, reorder, and edit the fields customers complete before checkout.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['text', 'Add Text'],
                    ['textarea', 'Add Text Area'],
                    ['select', 'Add Dropdown'],
                    ['file', 'Add Upload'],
                    ['filament_color', 'Add Color']
                  ].map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => createCustomizationField(type)}
                      className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {customizationFields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-blue-200 bg-white p-4 text-sm text-gray-500">
                    No custom fields yet. Add a field above when this product needs customer details.
                  </div>
                ) : customizationFields.map((field, index) => (
                  <div key={`${field.id || 'field'}-${index}`} className="rounded-xl border border-blue-100 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{field.label || field.id || `Field ${index + 1}`}</p>
                        <p className="text-xs text-gray-500">{field.type || 'text'} · {field.id || 'no field key'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => moveCustomizationField(index, -1)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">Up</button>
                        <button type="button" onClick={() => moveCustomizationField(index, 1)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">Down</button>
                        <button type="button" onClick={() => removeCustomizationField(index)} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Customer Label</span>
                        <input
                          value={field.label || ''}
                          onChange={(e) => updateCustomizationField(index, 'label', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Field Key</span>
                        <input
                          value={field.id || ''}
                          onChange={(e) => updateCustomizationField(index, 'id', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Field Type</span>
                        <select
                          value={field.type || 'text'}
                          onChange={(e) => updateCustomizationField(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="url">URL</option>
                          <option value="textarea">Text Area</option>
                          <option value="select">Dropdown</option>
                          <option value="file">File Upload</option>
                          <option value="filament_color">Color Picker</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-blue-100 px-3 py-2 text-sm font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={Boolean(field.required)}
                          onChange={(e) => updateCustomizationField(index, 'required', e.target.checked)}
                          className="h-4 w-4"
                        />
                        Required field
                      </label>
                      <label className="block md:col-span-2">
                        <span className="block text-xs font-semibold text-gray-600 mb-1">Helper Text / Small Note</span>
                        <input
                          value={field.helper || ''}
                          onChange={(e) => updateCustomizationField(index, 'helper', e.target.value)}
                          placeholder="Example: This color is for the straps and pocket."
                          className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                      {field.type !== 'filament_color' && field.type !== 'file' && (
                        <label className="block md:col-span-2">
                          <span className="block text-xs font-semibold text-gray-600 mb-1">Placeholder Text</span>
                          <input
                            value={field.placeholder || ''}
                            onChange={(e) => updateCustomizationField(index, 'placeholder', e.target.value)}
                            className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </label>
                      )}
                      {field.type === 'select' && (
                        <label className="block md:col-span-2">
                          <span className="block text-xs font-semibold text-gray-600 mb-1">Dropdown Options - one per line</span>
                          <textarea
                            value={(field.options || []).map((option) => typeof option === 'string' ? option : option?.label || option?.value || '').join('\n')}
                            onChange={(e) => updateCustomizationFieldOptions(index, e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </label>
                      )}
                      {field.type === 'filament_color' && (
                        <>
                          <label className="block">
                            <span className="block text-xs font-semibold text-gray-600 mb-1">Original Color Button Text</span>
                            <input
                              value={field.original_color_label || ''}
                              onChange={(e) => updateCustomizationField(index, 'original_color_label', e.target.value)}
                              placeholder="Original Color as Displayed"
                              className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                          <label className="block">
                            <span className="block text-xs font-semibold text-gray-600 mb-1">Single Color Button Text</span>
                            <input
                              value={field.single_color_label || ''}
                              onChange={(e) => updateCustomizationField(index, 'single_color_label', e.target.value)}
                              placeholder="Single Color"
                              className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                          <label className="flex items-center gap-2 rounded-lg border border-blue-100 px-3 py-2 text-sm font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={field.allow_tri_color !== false}
                              onChange={(e) => updateCustomizationField(index, 'allow_tri_color', e.target.checked)}
                              className="h-4 w-4"
                            />
                            Allow tri-color option
                          </label>
                          <label className="block">
                            <span className="block text-xs font-semibold text-gray-600 mb-1">Original Color Message</span>
                            <input
                              value={field.original_color_message || ''}
                              onChange={(e) => updateCustomizationField(index, 'original_color_message', e.target.value)}
                              className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700">Advanced JSON</label>
                <button
                  type="button"
                  onClick={insertFilamentColorSelector}
                  className="inline-flex items-center rounded-full border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                >
                  Insert Full Filament Template
                </button>
              </div>
              <textarea
                value={customizationFieldsJson}
                onChange={(e) => setCustomizationFieldsJson(e.target.value)}
                rows={9}
                placeholder='[{"id":"primary_color","label":"Primary Color","type":"text","required":true},{"id":"social_platform","label":"Social Media Platform","type":"select","options":["Instagram","TikTok"],"required":true},{"id":"front_cover_logo","label":"Upload Front Cover Logo","type":"file"}]'
                className="w-full px-3 py-2 border border-blue-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                Field types: text, url, textarea, select, file, filament_color. Use options for dropdowns/swatch selectors and required true/false.
              </p>
            </div>
          </div>

          {/* Pickup & Fulfillment Settings */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPickupSettings(!showPickupSettings)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-slate-800">Pickup & Fulfillment Settings</h3>
                  <p className="text-xs text-slate-500">
                    {formData.pickup_only 
                      ? 'Pickup Only' 
                      : formData.available_for_pickup 
                        ? `Pickup enabled${formData.pickup_location_ids.length > 0 ? ` (${formData.pickup_location_ids.length} location${formData.pickup_location_ids.length > 1 ? 's' : ''})` : ' (All locations)'}` 
                        : 'Shipping Only'}
                  </p>
                </div>
              </div>
              {showPickupSettings ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
            </button>
            
            {showPickupSettings && (
              <div className="p-4 space-y-4 border-t border-slate-200">
                {/* Fulfillment Mode Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, available_for_pickup: true, pickup_only: false })}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.available_for_pickup && !formData.pickup_only
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Truck className="h-4 w-4" />
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">Ship + Pickup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, available_for_pickup: false, pickup_only: false })}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      !formData.available_for_pickup
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">Ship Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, available_for_pickup: true, pickup_only: true })}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.pickup_only
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">Pickup Only</span>
                  </button>
                </div>

                {/* Pickup Locations (only show if pickup is enabled) */}
                {formData.available_for_pickup && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Available Pickup Locations
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={selectAllLocations}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={clearAllLocations}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      
                      {pickupLocations.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>No pickup locations configured. Add locations in the Pickup Locations tab.</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
                          {/* Info message about empty selection */}
                          {formData.pickup_location_ids.length === 0 && (
                            <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-xs mb-2">
                              <Info className="h-3 w-3 flex-shrink-0" />
                              <span>No locations selected = Product available at ALL locations</span>
                            </div>
                          )}
                          
                          {pickupLocations.map((location) => (
                            <label
                              key={location.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                formData.pickup_location_ids.includes(location.id)
                                  ? 'bg-emerald-50 border border-emerald-200'
                                  : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.pickup_location_ids.includes(location.id)}
                                onChange={() => togglePickupLocation(location.id)}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 text-sm">{location.name}</p>
                                <p className="text-xs text-slate-500 truncate">
                                  {location.address}, {location.city}
                                </p>
                              </div>
                              {formData.pickup_location_ids.includes(location.id) && (
                                <Check className="h-4 w-4 text-emerald-600" />
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Estimated Prep Time */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Estimated Prep Time (Optional)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={formData.estimated_prep_time}
                          onChange={(e) => setFormData({ ...formData, estimated_prep_time: e.target.value })}
                          placeholder="e.g., 24"
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600">hours</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">How long to prepare this item for pickup. Leave empty for default.</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
              Published (visible to customers)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images
          </label>
          <ImageUploader
            existingImages={formData.images}
            onImagesUploaded={handleImagesUploaded}
          />
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image Alt Text
            </label>
            <input
              type="text"
              value={formData.image_alt || ''}
              onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
              placeholder="Describe the product image"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};
