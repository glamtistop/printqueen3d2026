import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ImageUploader } from './ImageUploader';
import { Button } from '../ui/button';

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
    available_colors: []
  });
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);

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
        available_colors: product.available_colors || []
      });
    }
    fetchCategories();
    fetchCollections();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0
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
    } finally {
      setLoading(false);
    }
  };

  const handleImagesUploaded = (images) => {
    setFormData({ ...formData, images });
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Colors (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (colorInput.trim() && !formData.available_colors.includes(colorInput.trim())) {
                        setFormData({ 
                          ...formData, 
                          available_colors: [...formData.available_colors, colorInput.trim()] 
                        });
                        setColorInput('');
                      }
                    }
                  }}
                  placeholder="e.g., Red, Blue, Green"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (colorInput.trim() && !formData.available_colors.includes(colorInput.trim())) {
                      setFormData({ 
                        ...formData, 
                        available_colors: [...formData.available_colors, colorInput.trim()] 
                      });
                      setColorInput('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {formData.available_colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.available_colors.map((color, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            available_colors: formData.available_colors.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-gray-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">Add color options for customer selection. Leave empty if no color choice.</p>
            </div>
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
