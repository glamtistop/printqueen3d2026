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

export const ProductForm = ({ product, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: 0,
    images: [],
    published: true,
    collection_ids: [],
    variants: [],
    badge: '',
    available_colors: [],
    material_details: '',
    custom_builder: '',
    // Pickup settings
    available_for_pickup: true,
    pickup_only: false,
    pickup_location_ids: [],
    estimated_prep_time: ''
  });
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [customBuilders, setCustomBuilders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPickupSettings, setShowPickupSettings] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || '',
        stock: product.stock || '',
        images: product.images || [],
        published: product.published !== undefined ? product.published : true,
        collection_ids: product.collection_ids || [],
        variants: product.variants || [],
        badge: product.badge || '',
        available_colors: product.available_colors || [],
        material_details: product.material_details || '',
        custom_builder: product.custom_builder || '',
        // Pickup settings
        available_for_pickup: product.available_for_pickup !== undefined ? product.available_for_pickup : true,
        pickup_only: product.pickup_only || false,
        pickup_location_ids: product.pickup_location_ids || [],
        estimated_prep_time: product.estimated_prep_time || ''
      });
      // Show pickup settings if there are any non-default settings
      if (product.pickup_only || (product.pickup_location_ids && product.pickup_location_ids.length > 0) || !product.available_for_pickup) {
        setShowPickupSettings(true);
      }
    }
    fetchCategories();
    fetchCollections();
    fetchPickupLocations();
    fetchCustomBuilders();
  }, [product]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/collections`);
      setCollections(response.data);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
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
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
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
                Price ($) *
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
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material Details (Optional)
            </label>
            <textarea
              value={formData.material_details}
              onChange={(e) => setFormData({ ...formData, material_details: e.target.value })}
              placeholder="e.g., Premium PLA filament, eco-friendly, durable and lightweight"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Builder (Optional)
            </label>
            <select
              value={formData.custom_builder}
              onChange={(e) => setFormData({ ...formData, custom_builder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None - Standard Product Page</option>
              <option value="nfc-stand-builder">NFC Stand Builder</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Add custom builder component for product customization</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collections
            </label>
            <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {collections.length === 0 ? (
                <p className="text-sm text-gray-500">No collections available</p>
              ) : (
                collections.map((col) => (
                  <div key={col.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`collection-${col.id}`}
                      checked={formData.collection_ids.includes(col.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ 
                            ...formData, 
                            collection_ids: [...formData.collection_ids, col.id] 
                          });
                        } else {
                          setFormData({ 
                            ...formData, 
                            collection_ids: formData.collection_ids.filter(id => id !== col.id) 
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`collection-${col.id}`} className="ml-2 block text-sm text-gray-700">
                      {col.name}
                    </label>
                  </div>
                ))
              )}
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
