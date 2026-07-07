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
  Star,
  Globe,
  Info,
  Plus,
  Trash2
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const legacyHeroImages = new Set([
  '/assets/homepage/custom-3d-prints.png',
  '/assets/homepage/payment-stands.png',
  '/assets/homepage/nfc-keychain.png',
  '/assets/homepage/printqueen-hero-products.png'
]);

const normalizeHeroImages = (heroImages = {}) => {
  const desktopImages = Array.isArray(heroImages.desktop_images)
    ? heroImages.desktop_images.filter((image) => image && !legacyHeroImages.has(image))
    : [];
  return {
    ...heroImages,
    desktop_images: desktopImages.length ? [desktopImages[0]] : []
  };
};

const normalizeHomepageSections = (sections = []) => {
  const seen = new Set();
  return sections
    .filter((section) => {
      if (!section?.id || seen.has(section.id)) return false;
      seen.add(section.id);
      return true;
    })
    .map((section) => {
      if (section.id === 'marquee') {
        return {
          ...section,
          name: 'Top Announcement Marquee',
          order: 1,
          content: {
            ...section.content,
            headline: section.content?.headline || 'Top Announcement Marquee'
          }
        };
      }
      if (section.id === 'hero') {
        return { ...section, order: Math.max(Number(section.order || 2), 2) };
      }
      return section;
    })
    .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
};

const defaultNavigationItems = [
  { id: 'home', label: 'Home', link: '/', enabled: true, show_desktop: true, show_mobile: true, show_footer: false, footer_group: 'company', order: 1 },
  { id: 'personalize', label: 'Personalize', link: '/personalize', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, featured: true, order: 2 },
  { id: 'shop', label: 'Shop', link: '/shop', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, order: 3 },
  { id: 'design-your-own', label: 'Design Your Own', link: '/design-your-own', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, featured: true, order: 4 },
  { id: 'corporate-bulk', label: 'Corporate & Bulk', link: '/corporate-bulk-orders', enabled: true, show_desktop: false, show_mobile: false, show_footer: false, footer_group: 'hidden', order: 5 },
  { id: 'about', label: 'About', link: '/about', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, footer_group: 'company', order: 6 },
  { id: 'contact', label: 'Contact', link: '/contact', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, footer_group: 'company', order: 7 },
  { id: 'footer-personalized', label: 'Personalized Creations', link: '/personalize', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'shop', order: 8 },
  { id: 'footer-chains-pendants', label: 'Custom Chains & Pendants', link: '/shop', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'shop', order: 9 },
  { id: 'footer-nfc-business', label: 'NFC & Business Solutions', link: '/shop', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'shop', order: 10 },
  { id: 'footer-home-decor', label: 'Home Décor & Lithophanes', link: '/shop', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'shop', order: 11 },
  { id: 'footer-gifts', label: 'Gifts, Keepsakes & Celebrations', link: '/shop', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'shop', order: 12 },
  { id: 'footer-design-your-own', label: 'Design Your Own', link: '/design-your-own', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'shop', order: 13 },
  { id: 'footer-custom-order', label: 'Custom Order', link: '/design-your-own', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'company', order: 14 },
  { id: 'footer-corporate-bulk', label: 'Corporate & Bulk Orders', link: '/corporate-bulk-orders', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'company', order: 15 },
  { id: 'footer-partner-with-us', label: 'Partner With Us', link: '/contact', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'company', order: 16 },
  { id: 'shipping-policy', label: 'Shipping Policy', link: '/shipping-policy', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'support', order: 17 },
  { id: 'materials-process', label: 'Materials & 3D Printing', link: '/materials', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'support', order: 18 },
  { id: 'refund-policy', label: 'Refund Policy', link: '/refund-policy', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'support', order: 19 },
  { id: 'product-care', label: 'Product Care', link: '/product-care', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'support', order: 20 },
  { id: 'privacy', label: 'Privacy Policy', link: '/privacy-policy', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'support', order: 21 },
  { id: 'terms', label: 'Terms of Service', link: '/terms-of-service', enabled: true, show_desktop: false, show_mobile: false, show_footer: true, footer_group: 'support', order: 22 },
];

const getSelectedHomepageCategoryIds = (section) => (
  Array.isArray(section?.content?.homepage_category_ids)
    ? section.content.homepage_category_ids
    : []
);

const getHomepageCategoryTiles = (section, availableCategories) => {
  const selectedCategoryIds = getSelectedHomepageCategoryIds(section);
  const selectedCategories = selectedCategoryIds
    .map((categoryId) => availableCategories.find((category) => category.id === categoryId))
    .filter(Boolean);
  const categoriesToShow = selectedCategories.length > 0
    ? selectedCategories
    : availableCategories.slice(0, 6);

  return categoriesToShow
    .slice(0, 6)
    .map((category) => ({
      id: category.id,
      name: category.name,
      link: `/products?category=${encodeURIComponent(category.name)}`,
      image: category.image_url || ''
    }));
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
  onRename,
  isExpanded,
  onExpandToggle,
  availableCategories,
  onCategoryToggle
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

  const selectedCategoryIds = getSelectedHomepageCategoryIds(section);
  const homepageCategories = getHomepageCategoryTiles(section, availableCategories);
  const isUsingAutomaticCategories = selectedCategoryIds.length === 0;
  const content = section.content || {};

  const updateListItem = (field, index, value) => {
    const items = Array.isArray(content[field]) ? [...content[field]] : [];
    items[index] = value;
    onEdit(section.id, field, items);
  };

  const addListItem = (field, value = '') => {
    const items = Array.isArray(content[field]) ? content[field] : [];
    onEdit(section.id, field, [...items, value]);
  };

  const removeListItem = (field, index) => {
    const items = Array.isArray(content[field]) ? content[field] : [];
    onEdit(section.id, field, items.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveListItem = (field, index, direction) => {
    const items = Array.isArray(content[field]) ? [...content[field]] : [];
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const [item] = items.splice(index, 1);
    items.splice(nextIndex, 0, item);
    onEdit(section.id, field, items);
  };

  const marqueeMessages = Array.isArray(content.marquee_messages) ? content.marquee_messages : [];
  const marqueeImages = Array.isArray(content.marquee_images) ? content.marquee_images : [];
  const galleryImages = Array.isArray(content.gallery_images) ? content.gallery_images : [];

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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Section Name</label>
                <input
                  type="text"
                  value={section.name || ''}
                  onChange={(e) => onRename(section.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="Section name shown in editor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Badge / Small Label</label>
                <input
                  type="text"
                  value={content.badge_label ?? ''}
                  onChange={(e) => onEdit(section.id, 'badge_label', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="Leave blank to hide this label"
                />
                <p className="text-xs text-slate-500 mt-1">This controls the small label above a page or section title. Leave it blank to remove it.</p>
              </div>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Button Link</label>
                  <input
                    type="text"
                    value={section.content.button_link || ''}
                    onChange={(e) => onEdit(section.id, 'button_link', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
              {section.content.product_limit !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Products Shown</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={section.content.product_limit || 8}
                    onChange={(e) => onEdit(section.id, 'product_limit', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              )}
              {section.content.image_url !== undefined && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Section Image</label>
                  {section.content.image_url && (
                    <div className="relative mb-3 aspect-video max-w-md overflow-hidden rounded-lg border border-slate-200">
                      <img src={section.content.image_url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => onEdit(section.id, 'image_url', '')}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <ImageUploader
                    images={[]}
                    onUpload={(urls) => onEdit(section.id, 'image_url', urls[0] || '')}
                    maxImages={1}
                  />
                </div>
              )}
              {section.content.background_image_url !== undefined && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Background Image</label>
                  {section.content.background_image_url && (
                    <div className="relative mb-3 aspect-video max-w-md overflow-hidden rounded-lg border border-slate-200">
                      <img src={section.content.background_image_url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => onEdit(section.id, 'background_image_url', '')}
                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <ImageUploader
                    images={[]}
                    onUpload={(urls) => onEdit(section.id, 'background_image_url', urls[0] || '')}
                    maxImages={1}
                  />
                </div>
              )}
              {section.content.gallery_images !== undefined && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Images</label>
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      {galleryImages.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeListItem('gallery_images', index)}
                            className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-md"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <ImageUploader
                    images={[]}
                    onUpload={(urls) => onEdit(section.id, 'gallery_images', [...galleryImages, ...urls])}
                    maxImages={12}
                  />
                </div>
              )}
              {section.id === 'hero' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <h5 className="font-medium text-slate-800">Hero Buttons & Overlay</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Button Text</label>
                      <input
                        type="text"
                        value={content.secondary_button_text || ''}
                        onChange={(e) => onEdit(section.id, 'secondary_button_text', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="Shop Collections"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Button Link</label>
                      <input
                        type="text"
                        value={content.secondary_button_link || ''}
                        onChange={(e) => onEdit(section.id, 'secondary_button_link', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="#personalize"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Overlay Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="0.95"
                      step="0.05"
                      value={content.overlay_opacity ?? 0.72}
                      onChange={(e) => onEdit(section.id, 'overlay_opacity', Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">{Math.round((content.overlay_opacity ?? 0.72) * 100)}% overlay strength</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Overlay / Background Color</label>
                    <input
                      type="text"
                      value={content.overlay_color || ''}
                      onChange={(e) => onEdit(section.id, 'overlay_color', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder="#d8ecdd"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Desktop Height</label>
                      <input
                        type="number"
                        min="420"
                        max="900"
                        value={content.hero_height_desktop || 640}
                        onChange={(e) => onEdit(section.id, 'hero_height_desktop', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                      <p className="text-xs text-slate-500">Pixels</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Height</label>
                      <input
                        type="number"
                        min="420"
                        max="800"
                        value={content.hero_height_mobile || 560}
                        onChange={(e) => onEdit(section.id, 'hero_height_mobile', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                      <p className="text-xs text-slate-500">Pixels</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Image Position</label>
                      <input
                        type="text"
                        value={content.hero_image_position || 'center right'}
                        onChange={(e) => onEdit(section.id, 'hero_image_position', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="center right"
                      />
                      <p className="text-xs text-slate-500">Examples: center right, center, 70% center</p>
                    </div>
                  </div>
                </div>
              )}
              {section.id === 'about_preview' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <h5 className="font-medium text-slate-800">About Section Display</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mobile About Image</label>
                      {content.mobile_image_url && (
                        <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-slate-200">
                          <img src={content.mobile_image_url} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => onEdit(section.id, 'mobile_image_url', '')} className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <ImageUploader images={[]} onUpload={(urls) => onEdit(section.id, 'mobile_image_url', urls[0] || '')} maxImages={1} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Image Alt Text</label>
                      <input
                        type="text"
                        value={content.image_alt || ''}
                        onChange={(e) => onEdit(section.id, 'image_alt', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="Describe the image"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Image Crop / Position</label>
                      <input
                        type="text"
                        value={content.image_position || ''}
                        onChange={(e) => onEdit(section.id, 'image_position', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="center"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Text Size</label>
                      <select
                        value={content.text_size || 'lg'}
                        onChange={(e) => onEdit(section.id, 'text_size', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      >
                        <option value="sm">Small</option>
                        <option value="lg">Default</option>
                        <option value="xl">Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Button Size</label>
                      <select
                        value={content.button_size || 'default'}
                        onChange={(e) => onEdit(section.id, 'button_size', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      >
                        <option value="default">Default</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Section Padding</label>
                      <input
                        type="number"
                        min="24"
                        max="140"
                        value={content.section_padding_y || 64}
                        onChange={(e) => onEdit(section.id, 'section_padding_y', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Background Color</label>
                      <input
                        type="text"
                        value={content.background_color || ''}
                        onChange={(e) => onEdit(section.id, 'background_color', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              )}
              {[
                { field: 'steps', title: 'Steps', keyA: 'title', keyB: 'text', placeholderA: 'Step title', placeholderB: 'Step description', addLabel: '+ Add Step' },
                { field: 'faq_items', title: 'FAQ Questions & Answers', keyA: 'question', keyB: 'answer', placeholderA: 'Question', placeholderB: 'Answer', addLabel: '+ Add Question' },
                { field: 'info_cards', title: 'Cards', keyA: 'title', keyB: 'text', placeholderA: 'Card title', placeholderB: 'Card text', addLabel: '+ Add Card' }
              ].map((config) => {
                if (content[config.field] === undefined) return null;
                const pairItems = Array.isArray(content[config.field]) ? content[config.field] : [];
                return (
                  <div key={config.field} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <label className="block text-sm font-medium text-slate-700">{config.title}</label>
                    {pairItems.map((item, index) => (
                      <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item?.[config.keyA] || ''}
                            onChange={(e) => updateListItem(config.field, index, { ...item, [config.keyA]: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder={config.placeholderA}
                          />
                          <button
                            type="button"
                            onClick={() => moveListItem(config.field, index, -1)}
                            className="px-3 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveListItem(config.field, index, 1)}
                            className="px-3 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                            disabled={index >= pairItems.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeListItem(config.field, index)}
                            className="px-3 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          value={item?.[config.keyB] || ''}
                          onChange={(e) => updateListItem(config.field, index, { ...item, [config.keyB]: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                          placeholder={config.placeholderB}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addListItem(config.field, { [config.keyA]: '', [config.keyB]: '' })}
                      className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                    >
                      {config.addLabel}
                    </button>
                  </div>
                );
              })}

              {section.id === 'marquee' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  <div>
                    <h5 className="font-medium text-slate-800">Top Announcement Marquee</h5>
                    <p className="text-sm text-slate-500">This controls the scrolling announcement bar at the very top of the website.</p>
                  </div>
                  <div className="space-y-2">
                    {(marqueeMessages.length > 0 ? marqueeMessages : ['']).map((message, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => {
                            if (marqueeMessages.length === 0) {
                              onEdit(section.id, 'marquee_messages', [e.target.value]);
                            } else {
                              updateListItem('marquee_messages', index, e.target.value);
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="Marquee message"
                        />
                        <button
                          type="button"
                          onClick={() => moveListItem('marquee_messages', index, -1)}
                          className="px-3 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                          disabled={index === 0 || marqueeMessages.length === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveListItem('marquee_messages', index, 1)}
                          className="px-3 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                          disabled={index >= marqueeMessages.length - 1 || marqueeMessages.length === 0}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeListItem('marquee_messages', index)}
                          className="px-3 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          disabled={marqueeMessages.length === 0}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addListItem('marquee_messages')}
                      className="w-full py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                    >
                      + Add Marquee Message
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Speed</label>
                      <input
                        type="number"
                        min="12"
                        max="120"
                        value={content.marquee_speed ?? 36}
                        onChange={(e) => onEdit(section.id, 'marquee_speed', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                      <p className="text-xs text-slate-500">Seconds per loop</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Direction</label>
                      <select
                        value={content.marquee_direction || 'left'}
                        onChange={(e) => onEdit(section.id, 'marquee_direction', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Background Color</label>
                      <input
                        type="text"
                        value={content.marquee_background_color || ''}
                        onChange={(e) => onEdit(section.id, 'marquee_background_color', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="#ec4899"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Text Color</label>
                      <input
                        type="text"
                        value={content.marquee_text_color || ''}
                        onChange={(e) => onEdit(section.id, 'marquee_text_color', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="#ffffff"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Top/Bottom Padding</label>
                      <input
                        type="number"
                        min="4"
                        max="48"
                        value={content.marquee_padding_y ?? 12}
                        onChange={(e) => onEdit(section.id, 'marquee_padding_y', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                      <p className="text-xs text-slate-500">Pixels</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Message Gap</label>
                      <input
                        type="number"
                        min="12"
                        max="96"
                        value={content.marquee_gap ?? 32}
                        onChange={(e) => onEdit(section.id, 'marquee_gap', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                      <p className="text-xs text-slate-500">Pixels between items</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Background Image</label>
                    {content.marquee_background_image_url && (
                      <div className="relative mb-3 h-24 overflow-hidden rounded-lg border border-slate-200">
                        <img src={content.marquee_background_image_url} alt="Marquee background" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => onEdit(section.id, 'marquee_background_image_url', '')}
                          className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <ImageUploader
                      images={[]}
                      onUpload={(urls) => onEdit(section.id, 'marquee_background_image_url', urls[0] || '')}
                      maxImages={1}
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={content.marquee_show_images ?? false}
                      onChange={(e) => onEdit(section.id, 'marquee_show_images', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Show image items in marquee</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Marquee Images</label>
                    {marqueeImages.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                        {marqueeImages.map((url, index) => (
                          <div key={index} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            <img src={url} alt={`Marquee ${index + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeListItem('marquee_images', index)}
                              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-md"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <ImageUploader
                      images={[]}
                      onUpload={(urls) => onEdit(section.id, 'marquee_images', [...marqueeImages, ...urls])}
                      maxImages={8}
                    />
                  </div>
                </div>
              )}
              {section.id === 'categories' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h5 className="font-medium text-slate-800">Homepage Categories</h5>
                      <p className="text-sm text-slate-500">
                        {homepageCategories.length} visible. Star up to 6 categories to choose exactly what appears.
                      </p>
                    </div>
                  </div>

                  {isUsingAutomaticCategories && availableCategories.length > 0 && (
                    <div className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      Automatically showing the first {homepageCategories.length} created {homepageCategories.length === 1 ? 'category' : 'categories'} until you star specific ones.
                    </div>
                  )}

                  {availableCategories.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                      No categories have been created yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableCategories.map((category) => {
                        const isStarred = selectedCategoryIds.includes(category.id);
                        const isAutoShown = isUsingAutomaticCategories && homepageCategories.some((tile) => tile.id === category.id);

                        return (
                        <div key={category.id} className={`flex items-center gap-3 rounded-lg border p-2 ${isStarred || isAutoShown ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-slate-50'}`}>
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-blue-50 to-emerald-50">
                            {category.image_url ? (
                              <img src={category.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                                {category.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">{category.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {isStarred ? 'Starred for homepage' : isAutoShown ? 'Auto shown' : 'Not shown'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onCategoryToggle(section.id, category.id)}
                            className={`p-2 rounded-lg transition-colors ${isStarred ? 'text-amber-500 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'}`}
                            aria-label={`${isStarred ? 'Unstar' : 'Star'} ${category.name}`}
                          >
                            <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        );
                      })}
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
    contact_info: { email: 'printqueen3d@gmail.com', phone: '(310) 936-1893', address: 'Los Angeles, California' },
    social_links: { instagram: '', facebook: '', twitter: '', tiktok: '', youtube: '' },
    app_icons: { favicon_32: '', apple_touch_180: '', android_192: '', pwa_512: '' },
    hero_images: { desktop_images: [], mobile_image: '' },
    navigation_items: defaultNavigationItems,
    footer_shop_title: 'Shop',
    footer_company_title: 'Company',
    footer_support_title: 'Support',
    footer_contact_title: 'Contact',
    footer_links_title: 'Company',
    footer_policies_title: 'Support',
    footer_partner_title: '',
    footer_partner_text: '',
    footer_partner_link_text: 'Send a partner inquiry',
    footer_partner_link: '/contact',
    footer_description: 'Professionally 3D printed custom creations made to order with precision and care.',
    footer_location_text: 'Los Angeles, California',
    footer_pickup_text: 'Los Angeles, California',
    footer_instagram_label: 'Instagram: @printqueen3d',
    footer_tiktok_label: 'TikTok: @printqueen3d',
    footer_x_label: 'X: @printqueen3d',
    footer_background_color: '',
    footer_text_color: '',
    footer_text_size: '',
    footer_padding_y: null,
    footer_text: 'All rights reserved.'
  });
  
  const [sections, setSections] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [reviews, setReviews] = useState([]);

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
      const [settingsResult, sectionsResult, categoriesResult, reviewsResult] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/api/admin/site-settings`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/admin/homepage-sections`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/categories`),
        axios.get(`${BACKEND_URL}/api/admin/reviews`, { withCredentials: true })
      ]);

      if (settingsResult.status === 'fulfilled') {
        const settingsData = settingsResult.value.data || {};
        setSettings(prev => ({
          ...prev,
          ...settingsData,
          app_icons: { ...prev.app_icons, ...(settingsData.app_icons || {}) },
          hero_images: normalizeHeroImages({ ...prev.hero_images, ...(settingsData.hero_images || {}) }),
          brand_colors: { ...prev.brand_colors, ...(settingsData.brand_colors || {}) },
          contact_info: { ...prev.contact_info, ...(settingsData.contact_info || {}) },
          social_links: { ...prev.social_links, ...(settingsData.social_links || {}) },
          navigation_items: settingsData.navigation_items?.length ? settingsData.navigation_items : defaultNavigationItems
        }));
      } else {
        console.error('Failed to load site settings:', settingsResult.reason);
        toast.error('Site settings could not fully load. You can still edit available sections.');
      }

      if (sectionsResult.status === 'fulfilled') {
        setSections(normalizeHomepageSections(sectionsResult.value.data?.sections || []));
        setExpandedSections((prev) => ({ marquee: true, ...prev }));
      } else {
        console.error('Failed to load homepage sections:', sectionsResult.reason);
        toast.error('Homepage sections could not load. Please check your admin login and backend deployment.');
      }

      if (categoriesResult.status === 'fulfilled') {
        setAvailableCategories(categoriesResult.value.data || []);
      } else {
        console.error('Failed to load categories:', categoriesResult.reason);
        setAvailableCategories([]);
      }

      if (reviewsResult.status === 'fulfilled') {
        setReviews(reviewsResult.value.data || []);
      } else {
        console.error('Failed to load reviews:', reviewsResult.reason);
        setReviews([]);
      }
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
      const cleanSections = normalizeHomepageSections(sections);
      const response = await axios.put(`${BACKEND_URL}/api/admin/homepage-sections`, { sections: cleanSections }, { withCredentials: true });
      setSections(normalizeHomepageSections(response.data?.sections || cleanSections));
      toast.success('Homepage sections saved!');
    } catch (error) {
      console.error('Failed to save sections:', error);
      toast.error('Failed to save sections');
    } finally {
      setSaving(false);
    }
  };

  const refreshReviews = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/reviews`, { withCredentials: true });
      setReviews(response.data || []);
    } catch (error) {
      toast.error('Failed to load reviews');
    }
  };

  const updateReview = async (reviewId, updateData) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/reviews/${reviewId}`, updateData, { withCredentials: true });
      await refreshReviews();
      toast.success('Review updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update review');
    }
  };

  const updateReviewDraft = (reviewId, field, value) => {
    setReviews(prev => prev.map(review =>
      review.id === reviewId ? { ...review, [field]: value } : review
    ));
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/reviews/${reviewId}`, { withCredentials: true });
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success('Review deleted');
    } catch (error) {
      toast.error('Failed to delete review');
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

  const renameSection = (sectionId, name) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, name } : section
    ));
  };

  const toggleHomepageCategory = (sectionId, categoryId) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      const selectedCategoryIds = getSelectedHomepageCategoryIds(section);
      const isSelected = selectedCategoryIds.includes(categoryId);

      if (!isSelected && selectedCategoryIds.length >= 6) {
        toast.error('Only 6 homepage categories can be starred at a time');
        return section;
      }

      return {
        ...section,
        content: {
          ...section.content,
          homepage_category_ids: isSelected
            ? selectedCategoryIds.filter((id) => id !== categoryId)
            : [...selectedCategoryIds, categoryId]
        }
      };
    }));
  };

  const toggleExpanded = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Hero image handlers
  const addDesktopImage = (urls) => {
    const nextImage = urls?.[0] || '';
    setSettings(prev => ({
      ...prev,
      hero_images: { ...prev.hero_images, desktop_images: nextImage ? [nextImage] : [] }
    }));
  };

  const removeDesktopImage = () => {
    setSettings(prev => ({
      ...prev,
      hero_images: { ...prev.hero_images, desktop_images: [] }
    }));
  };

  const updateNavigationItem = (itemId, field, value) => {
    setSettings(prev => ({
      ...prev,
      navigation_items: (prev.navigation_items || defaultNavigationItems).map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const addNavigationItem = () => {
    setSettings(prev => {
      const items = prev.navigation_items || defaultNavigationItems;
      const nextOrder = items.length + 1;
      return {
        ...prev,
        navigation_items: [
          ...items,
          {
            id: `nav-${Date.now()}`,
            label: 'New Link',
            link: '#',
            enabled: true,
            show_desktop: true,
            show_mobile: true,
            show_footer: false,
            featured: false,
            order: nextOrder
          }
        ]
      };
    });
  };

  const removeNavigationItem = (itemId) => {
    setSettings(prev => ({
      ...prev,
      navigation_items: (prev.navigation_items || defaultNavigationItems)
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index + 1 }))
    }));
  };

  const moveNavigationItem = (itemId, direction) => {
    setSettings(prev => {
      const items = [...(prev.navigation_items || defaultNavigationItems)].sort((a, b) => (a.order || 0) - (b.order || 0));
      const index = items.findIndex(item => item.id === itemId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return prev;
      const [item] = items.splice(index, 1);
      items.splice(nextIndex, 0, item);
      return {
        ...prev,
        navigation_items: items.map((navItem, navIndex) => ({ ...navItem, order: navIndex + 1 }))
      };
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'navigation', label: 'Navigation', icon: Layout },
    { id: 'hero', label: 'Hero Images', icon: ImageIcon },
    { id: 'icons', label: 'Favicon & Icons', icon: Globe },
    { id: 'sections', label: 'Sections', icon: Layout },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'footer', label: 'Footer & Social', icon: LinkIcon }
  ];

  const featuredReviewCount = reviews.filter(review => review.featured && review.status === 'approved').length;

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
        {activeTab !== 'reviews' && (
          <button
            onClick={activeTab === 'sections' ? handleSaveSections : handleSaveSettings}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Changes
          </button>
        )}
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

        {activeTab === 'navigation' && (
          <motion.div key="navigation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Navigation Menu</h3>
                  <p className="text-sm text-slate-500">Control desktop header, mobile menu, and footer links.</p>
                </div>
                <button
                  type="button"
                  onClick={addNavigationItem}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-2.5 font-semibold text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </button>
              </div>

              <div className="space-y-3">
                {[...(settings.navigation_items || defaultNavigationItems)]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((item, index, items) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_auto] gap-3 items-start">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Label</label>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateNavigationItem(item.id, 'label', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Link</label>
                          <input
                            type="text"
                            value={item.link}
                            onChange={(e) => updateNavigationItem(item.id, 'link', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="flex items-center gap-2 lg:pt-5">
                          <button
                            type="button"
                            onClick={() => moveNavigationItem(item.id, -1)}
                            disabled={index === 0}
                            className="rounded-lg bg-white px-3 py-2 text-slate-500 disabled:opacity-40"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveNavigationItem(item.id, 1)}
                            disabled={index === items.length - 1}
                            className="rounded-lg bg-white px-3 py-2 text-slate-500 disabled:opacity-40"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeNavigationItem(item.id)}
                            className="rounded-lg bg-white p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          ['enabled', 'Enabled'],
                          ['show_desktop', 'Desktop'],
                          ['show_mobile', 'Mobile'],
                          ['show_footer', 'Footer'],
                          ['featured', 'Highlight']
                        ].map(([field, label]) => (
                          <label key={field} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={field === 'featured' ? Boolean(item[field]) : item[field] !== false}
                              onChange={(e) => updateNavigationItem(item.id, field, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 max-w-xs">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Footer Column</label>
                        <select
                          value={item.footer_group || 'company'}
                          onChange={(e) => updateNavigationItem(item.id, 'footer_group', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                          <option value="shop">Shop</option>
                          <option value="company">Company</option>
                          <option value="support">Support</option>
                          <option value="hidden">Hidden Column</option>
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'hero' && (
          <motion.div key="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Desktop Hero Background */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-blue-500" /> Desktop Hero Background Image
                  </h3>
                  <p className="text-sm text-slate-500">Upload one image for the homepage hero background</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${settings.hero_images.desktop_images?.[0] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {settings.hero_images.desktop_images?.[0] ? 'Image set' : 'No image set'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                <Info className="h-4 w-4" />
                <span>Recommended: 1920x900px or wider, JPG/PNG, under 2MB when possible</span>
              </div>

              {settings.hero_images.desktop_images?.[0] && (
                <div className="relative group aspect-video max-w-xl mb-4">
                  <img src={settings.hero_images.desktop_images[0]} alt="Current desktop hero background" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                  <button
                    onClick={removeDesktopImage}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <ImageUploader
                images={[]}
                onUpload={addDesktopImage}
                maxImages={1}
              />
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
                      onRename={renameSection}
                      isExpanded={expandedSections[section.id]}
                      onExpandToggle={toggleExpanded}
                      availableCategories={availableCategories}
                      onCategoryToggle={toggleHomepageCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" /> Customer Reviews
                  </h3>
                  <p className="text-sm text-slate-500">Approve reviews and highlight up to 4 on the homepage.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {featuredReviewCount}/4 highlighted
                  </span>
                  <button
                    type="button"
                    onClick={refreshReviews}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </button>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
                  Customer reviews will appear here after someone submits the review form.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              review.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : review.status === 'hidden'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-amber-100 text-amber-700'
                            }`}>
                              {review.status || 'pending'}
                            </span>
                            {review.featured && (
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Highlighted</span>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                            <input
                              value={review.name || ''}
                              onChange={(event) => updateReviewDraft(review.id, 'name', event.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              placeholder="Customer name"
                            />
                            <select
                              value={review.rating || 5}
                              onChange={(event) => updateReviewDraft(review.id, 'rating', Number(event.target.value))}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            >
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <option key={rating} value={rating}>{rating} Star{rating === 1 ? '' : 's'}</option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            value={review.review || ''}
                            onChange={(event) => updateReviewDraft(review.id, 'review', event.target.value)}
                            rows="3"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Review text"
                          />
                          <div className="flex gap-1 text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => updateReview(review.id, { name: review.name, rating: Number(review.rating), review: review.review })}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Save Text
                          </button>
                          <select
                            value={review.status || 'pending'}
                            onChange={(event) => updateReview(review.id, { status: event.target.value, featured: event.target.value === 'approved' ? review.featured : false })}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="hidden">Hidden</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => updateReview(review.id, { featured: !review.featured })}
                            disabled={!review.featured && featuredReviewCount >= 4}
                            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                              review.featured
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40'
                            }`}
                          >
                            {review.featured ? 'Unhighlight' : 'Highlight'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteReview(review.id)}
                            className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'footer' && (
          <motion.div key="footer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-500" /> Footer Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.contact_info.email || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_info: { ...prev.contact_info, email: e.target.value } }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="printqueen3d@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={settings.contact_info.phone || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, contact_info: { ...prev.contact_info, phone: e.target.value } }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="(310) 936-1893"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={settings.footer_location_text || settings.contact_info.address || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, footer_location_text: e.target.value, contact_info: { ...prev.contact_info, address: e.target.value } }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Los Angeles, California"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Footer Description</label>
                <textarea
                  value={settings.footer_description || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, footer_description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  placeholder="Professionally 3D printed custom creations made to order with precision and care."
                />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[['instagram', Instagram, 'Instagram'], ['tiktok', Globe, 'TikTok'], ['facebook', Facebook, 'Facebook'], ['twitter', Twitter, 'Twitter / X'], ['youtube', Youtube, 'YouTube']].map(([key, Icon, label]) => (
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
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  ['footer_instagram_label', 'Instagram Label', 'Instagram: @printqueen3d'],
                  ['footer_tiktok_label', 'TikTok Label', 'TikTok: @printqueen3d'],
                  ['footer_x_label', 'X Label', 'X: @printqueen3d'],
                ].map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
                    <input
                      type="text"
                      value={settings[key] || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Footer Settings</h3>
              <div className="mb-5 rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                Footer links are edited in the Navigation tab. Turn on “Footer” and choose a Footer Column for any link you want shown.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['footer_shop_title', 'Shop Column Heading', 'Shop'],
                  ['footer_company_title', 'Company Column Heading', 'Company'],
                  ['footer_support_title', 'Support Column Heading', 'Support'],
                  ['footer_contact_title', 'Contact Heading', 'Contact'],
                  ['footer_text', 'Footer Copyright Text', 'All rights reserved.'],
                ].map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
                    <input
                      type="text"
                      value={settings[key] || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  ['footer_background_color', 'Background Color', '#0f172a'],
                  ['footer_text_color', 'Text Color', '#ffffff'],
                  ['footer_text_size', 'Text Size', '14px'],
                  ['footer_padding_y', 'Top Padding', '48'],
                ].map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
                    <input
                      type={key === 'footer_padding_y' ? 'number' : 'text'}
                      value={settings[key] || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, [key]: key === 'footer_padding_y' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
