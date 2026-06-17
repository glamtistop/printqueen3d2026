import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Settings,
  Layout,
  Type,
  Palette,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  GripVertical,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Link as LinkIcon,
  Smartphone,
  Monitor,
  X,
  Plus,
  Trash2,
  Globe,
  Info
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_HOMEPAGE_CATEGORIES = [
  { name: 'Payment Stands', link: '/products?category=Payment%20Stands', image: '/assets/homepage/category-payment-stands.jpg' },
  { name: 'Keychains', link: '/products?category=Keychains', image: '/assets/homepage/category-keychains.jpg' },
  { name: 'Home Decor', link: '/products?category=Home%20Decor', image: '/assets/homepage/category-home-decor.jpg' },
  { name: 'Incense Holders', link: '/products?category=Incense%20Holders', image: '/assets/homepage/category-incense-holders.jpg' },
  { name: 'Toys & Fidgets', link: '/products?category=Toys%20%26%20Fidgets', image: '/assets/homepage/category-toys-fidgets.jpg' },
  { name: 'Custom 3D Prints', link: '/products?category=Custom%203D%20Prints', image: '/assets/homepage/category-custom-3d-prints.jpg' }
];

const getHomepageCategoryTiles = (section) => {
  const categories = section?.content?.categories;
  return Array.isArray(categories) ? categories : DEFAULT_HOMEPAGE_CATEGORIES;
};

// Image Preview Component with recommendations
const ImagePreviewWithInfo = ({ url, label, recommendation, onRemove, className = '' }) => (
  <div className={`relative group ${className}`}>
    {url ? (
      <div className="relative">
        <img
          src={url}
          alt={label}
          className="w-full h-full object-contain rounded-xl border border-slate-200 bg-slate-50"
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    ) : (
      <div className="w-full h-full flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
        <ImageIcon className="h-8 w-8 text-slate-300" />
      </div>
    )}
    <p className="text-xs text-slate-500 mt-1 text-center">{label}</p>
    {recommendation && (
      <p className="text-xs text-blue-500 text-center">{recommendation}</p>
    )}
  </div>
);

// Sortable Section Item Component
const SortableSectionItem = ({
  section,
  onToggle,
  onEdit,
  isExpanded,
  onExpandToggle,
  availableCategories,
  onCategoryAdd,
  onCategoryRemove
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const homepageCategories = getHomepageCategoryTiles(section);
  const addableCategories = availableCategories.filter((category) =>
    !homepageCategories.some((tile) => tile.name === category.name)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border ${isDragging ? 'border-blue-500 shadow-lg z-50' : 'border-slate-200'} overflow-hidden`}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          {...attributes}
          {...listeners}
          className="p-2 rounded-lg hover:bg-slate-100 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5 text-slate-400" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800">{section.name}</h4>
          <p className="text-sm text-slate-500">Order: {section.order}</p>
        </div>

        <button
          onClick={() => onToggle(section.id)}
          className={`p-2 rounded-lg transition-colors ${section.enabled ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        >
          {section.enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>

        <button
          onClick={() => onExpandToggle(section.id)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-slate-50">
              {section.content.headline !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
                  <input
                    type="text"
                    value={section.content.headline || ''}
                    onChange={(e) => onEdit(section.id, 'headline', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Section headline"
                  />
                </div>
              )}
              {section.content.subheadline !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subheadline</label>
                  <input
                    type="text"
                    value={section.content.subheadline || ''}
                    onChange={(e) => onEdit(section.id, 'subheadline', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Subheadline text"
                  />
                </div>
              )}
              {section.content.description !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={section.content.description || ''}
                    onChange={(e) => onEdit(section.id, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                    placeholder="Section description"
                  />
                </div>
              )}
              {section.content.button_text !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={section.content.button_text || ''}
                      onChange={(e) => onEdit(section.id, 'button_text', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                  {section.content.button_link !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Button Link</label>
                      <input
                        type="text"
                        value={section.content.button_link || ''}
                        onChange={(e) => onEdit(section.id, 'button_link', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
              {section.id === 'categories' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h5 className="font-medium text-slate-800">Homepage Categories</h5>
                      <p className="text-sm text-slate-500">{homepageCategories.length} visible</p>
                    </div>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onCategoryAdd(section.id, e.target.value);
                        }
                      }}
                      className="max-w-56 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    >
                      <option value="">Add category</option>
                      {addableCategories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  {homepageCategories.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                      No homepage categories selected.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {homepageCategories.map((category, index) => (
                        <div key={`${category.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2">
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-blue-50 to-emerald-50">
                            {category.image ? (
                              <img src={category.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                                {category.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">{category.name}</p>
                            <p className="truncate text-xs text-slate-500">{category.link || `/products?category=${encodeURIComponent(category.name)}`}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onCategoryRemove(section.id, index)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            aria-label={`Remove ${category.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SiteEditor = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  
  const [settings, setSettings] = useState({
    logo_url: '',
    site_name: 'Print Queen 3D',
    tagline: 'Custom 3D Printed Creations',
    brand_colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' },
    contact_info: { email: '', phone: '', address: '' },
    social_links: { instagram: '', facebook: '', twitter: '', tiktok: '', youtube: '' },
    app_icons: { favicon_32: '', apple_touch_180: '', android_192: '', pwa_512: '' },
    hero_images: { desktop_images: [], mobile_image: '' },
    footer_text: 'All rights reserved.'
  });
  
  const [sections, setSections] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, sectionsRes, categoriesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/site-settings`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/admin/homepage-sections`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/categories`)
      ]);
      setSettings(prev => ({
        ...prev,
        ...settingsRes.data,
        app_icons: { ...prev.app_icons, ...settingsRes.data.app_icons },
        hero_images: { ...prev.hero_images, ...settingsRes.data.hero_images }
      }));
      setSections(sectionsRes.data.sections || []);
      setAvailableCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch site config:', error);
      toast.error('Failed to load site configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin/site-settings`, settings, { withCredentials: true });
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSections = async () => {
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin/homepage-sections`, { sections }, { withCredentials: true });
      toast.success('Homepage sections saved!');
    } catch (error) {
      console.error('Failed to save sections:', error);
      toast.error('Failed to save sections');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index + 1 }));
      });
    }
  };

  const toggleSection = (sectionId) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, enabled: !section.enabled } : section
    ));
  };

  const editSectionContent = (sectionId, field, value) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, content: { ...section.content, [field]: value } } : section
    ));
  };

  const addHomepageCategory = (sectionId, categoryId) => {
    const category = availableCategories.find((item) => item.id === categoryId);
    if (!category) return;

    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      const currentCategories = getHomepageCategoryTiles(section);
      if (currentCategories.some((tile) => tile.name === category.name)) {
        return section;
      }

      const nextCategory = {
        name: category.name,
        link: `/products?category=${encodeURIComponent(category.name)}`,
        image: category.image_url || ''
      };

      return {
        ...section,
        content: {
          ...section.content,
          categories: [...currentCategories, nextCategory]
        }
      };
    }));
  };

  const removeHomepageCategory = (sectionId, indexToRemove) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      const currentCategories = getHomepageCategoryTiles(section);
      return {
        ...section,
        content: {
          ...section.content,
          categories: currentCategories.filter((_, index) => index !== indexToRemove)
        }
      };
    }));
  };

  const toggleExpanded = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Hero image handlers
  const addDesktopImage = (urls) => {
    const currentImages = settings.hero_images.desktop_images || [];
    if (currentImages.length >= 6) {
      toast.error('Maximum 6 images allowed for carousel');
      return;
    }
    const newImages = [...currentImages, ...urls].slice(0, 6);
    setSettings(prev => ({
      ...prev,
      hero_images: { ...prev.hero_images, desktop_images: newImages }
    }));
  };

  const removeDesktopImage = (index) => {
    const newImages = settings.hero_images.desktop_images.filter((_, i) => i !== index);
    setSettings(prev => ({
      ...prev,
      hero_images: { ...prev.hero_images, desktop_images: newImages }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'hero', label: 'Hero Images', icon: ImageIcon },
    { id: 'icons', label: 'Favicon & Icons', icon: Globe },
    { id: 'sections', label: 'Sections', icon: Layout },
    { id: 'footer', label: 'Footer & Social', icon: LinkIcon }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Site Editor</h1>
          <p className="text-slate-500">Customize your storefront appearance</p>
        </div>
        <button
          onClick={activeTab === 'sections' ? handleSaveSections : handleSaveSettings}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'general' && (
          <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Logo Section */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-500" /> Logo & Branding
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Site Logo</label>
                  <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
                    <Info className="h-4 w-4" />
                    <span>Recommended: 400x120px, PNG or SVG, under 500KB</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Current Logo Preview */}
                    <div className="w-full sm:w-48 h-24 flex-shrink-0">
                      <ImagePreviewWithInfo
                        url={settings.logo_url}
                        label="Current Logo"
                        className="h-full"
                      />
                    </div>
                    {/* Upload New */}
                    <div className="flex-1">
                      <ImageUploader
                        images={[]}
                        onUpload={(urls) => setSettings(prev => ({ ...prev, logo_url: urls[0] || '' }))}
                        maxImages={1}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={settings.site_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-500" /> Brand Colors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[['primary', 'Primary'], ['secondary', 'Secondary'], ['accent', 'Accent']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{label} Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.brand_colors[key]}
                        onChange={(e) => setSettings(prev => ({ ...prev, brand_colors: { ...prev.brand_colors, [key]: e.target.value } }))}
                        className="h-12 w-12 rounded-lg cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={settings.brand_colors[key]}
                        onChange={(e) => setSettings(prev => ({ ...prev, brand_colors: { ...prev.brand_colors, [key]: e.target.value } }))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-3">Preview:</p>
                <div className="flex gap-3">
                  {['primary', 'secondary', 'accent'].map((key) => (
                    <div key={key} className="h-10 flex-1 rounded-lg shadow-sm flex items-center justify-center text-white text-sm font-medium capitalize" style={{ backgroundColor: settings.brand_colors[key] }}>
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-500" /> Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2"><Mail className="h-4 w-4 inline mr-1" /> Email</label>
                  <input
                    type="email"
                    value={settings.contact_info.email || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_info: { ...prev.contact_info, email: e.target.value } }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="contact@yoursite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2"><Phone className="h-4 w-4 inline mr-1" /> Phone</label>
                  <input
                    type="tel"
                    value={settings.contact_info.phone || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_info: { ...prev.contact_info, phone: e.target.value } }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2"><MapPin className="h-4 w-4 inline mr-1" /> Address</label>
                  <input
                    type="text"
                    value={settings.contact_info.address || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_info: { ...prev.contact_info, address: e.target.value } }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="City, State"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'hero' && (
          <motion.div key="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Desktop Hero Carousel */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-blue-500" /> Desktop Hero Carousel
                  </h3>
                  <p className="text-sm text-slate-500">Up to 6 images for the rotating carousel</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${(settings.hero_images.desktop_images?.length || 0) >= 6 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {settings.hero_images.desktop_images?.length || 0} / 6
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                <Info className="h-4 w-4" />
                <span>Recommended: 1920x550px, JPG/PNG, under 1MB each</span>
              </div>

              {/* Current Images Grid */}
              {settings.hero_images.desktop_images?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                  {settings.hero_images.desktop_images.map((url, index) => (
                    <div key={index} className="relative group aspect-video">
                      <img src={url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover rounded-xl border border-slate-200" />
                      <button
                        onClick={() => removeDesktopImage(index)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{index + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Images */}
              {(settings.hero_images.desktop_images?.length || 0) < 6 && (
                <ImageUploader
                  images={[]}
                  onUpload={addDesktopImage}
                  maxImages={6 - (settings.hero_images.desktop_images?.length || 0)}
                />
              )}
            </div>

            {/* Mobile Hero */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-500" /> Mobile Hero Image
              </h3>
              <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                <Info className="h-4 w-4" />
                <span>Recommended: 750x600px, JPG/PNG, under 500KB</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48 h-40 flex-shrink-0">
                  <ImagePreviewWithInfo
                    url={settings.hero_images.mobile_image}
                    label="Current Mobile Hero"
                    className="h-full"
                    onRemove={settings.hero_images.mobile_image ? () => setSettings(prev => ({ ...prev, hero_images: { ...prev.hero_images, mobile_image: '' } })) : null}
                  />
                </div>
                <div className="flex-1">
                  <ImageUploader
                    images={[]}
                    onUpload={(urls) => setSettings(prev => ({ ...prev, hero_images: { ...prev.hero_images, mobile_image: urls[0] || '' } }))}
                    maxImages={1}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'icons' && (
          <motion.div key="icons" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" /> Favicon & App Icons
              </h3>
              <p className="text-sm text-slate-500 mb-6">These icons appear in browser tabs, bookmarks, and when users add your site to their home screen.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Favicon 32x32 */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Browser Favicon</h4>
                  <div className="w-20 h-20 mx-auto mb-3">
                    <ImagePreviewWithInfo url={settings.app_icons.favicon_32} label="" recommendation="32x32px" className="h-full" />
                  </div>
                  <ImageUploader images={[]} onUpload={(urls) => setSettings(prev => ({ ...prev, app_icons: { ...prev.app_icons, favicon_32: urls[0] || '' } }))} maxImages={1} />
                </div>

                {/* Apple Touch 180x180 */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">iPhone/iPad Icon</h4>
                  <div className="w-20 h-20 mx-auto mb-3">
                    <ImagePreviewWithInfo url={settings.app_icons.apple_touch_180} label="" recommendation="180x180px" className="h-full" />
                  </div>
                  <ImageUploader images={[]} onUpload={(urls) => setSettings(prev => ({ ...prev, app_icons: { ...prev.app_icons, apple_touch_180: urls[0] || '' } }))} maxImages={1} />
                </div>

                {/* Android 192x192 */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Android Icon</h4>
                  <div className="w-20 h-20 mx-auto mb-3">
                    <ImagePreviewWithInfo url={settings.app_icons.android_192} label="" recommendation="192x192px" className="h-full" />
                  </div>
                  <ImageUploader images={[]} onUpload={(urls) => setSettings(prev => ({ ...prev, app_icons: { ...prev.app_icons, android_192: urls[0] || '' } }))} maxImages={1} />
                </div>

                {/* PWA 512x512 */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">PWA Splash Icon</h4>
                  <div className="w-20 h-20 mx-auto mb-3">
                    <ImagePreviewWithInfo url={settings.app_icons.pwa_512} label="" recommendation="512x512px" className="h-full" />
                  </div>
                  <ImageUploader images={[]} onUpload={(urls) => setSettings(prev => ({ ...prev, app_icons: { ...prev.app_icons, pwa_512: urls[0] || '' } }))} maxImages={1} />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> Upload a square PNG image (512x512px recommended) and we will use it for all icon sizes. You can override individual sizes above if needed.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'sections' && (
          <motion.div key="sections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Homepage Sections</h3>
                <p className="text-sm text-slate-500">Drag to reorder, toggle visibility, edit content</p>
              </div>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {sections.map((section) => (
                    <SortableSectionItem
                      key={section.id}
                      section={section}
                      onToggle={toggleSection}
                      onEdit={editSectionContent}
                      isExpanded={expandedSections[section.id]}
                      onExpandToggle={toggleExpanded}
                      availableCategories={availableCategories}
                      onCategoryAdd={addHomepageCategory}
                      onCategoryRemove={removeHomepageCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        )}

        {activeTab === 'footer' && (
          <motion.div key="footer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[['instagram', Instagram, 'Instagram'], ['facebook', Facebook, 'Facebook'], ['twitter', Twitter, 'Twitter / X'], ['youtube', Youtube, 'YouTube']].map(([key, Icon, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2"><Icon className="h-4 w-4 inline mr-2" />{label}</label>
                    <input
                      type="url"
                      value={settings.social_links[key] || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: e.target.value } }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder={`https://${key}.com/yourpage`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Footer Settings</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Footer Copyright Text</label>
                <input
                  type="text"
                  value={settings.footer_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, footer_text: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="All rights reserved."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
