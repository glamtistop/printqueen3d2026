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
  Link as LinkIcon
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Sortable Section Item Component
const SortableSectionItem = ({ section, onToggle, onEdit, isExpanded, onExpandToggle }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border ${isDragging ? 'border-blue-500 shadow-lg z-50' : 'border-slate-200'} overflow-hidden`}
    >
      {/* Section Header */}
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
          className={`p-2 rounded-lg transition-colors ${
            section.enabled
              ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          {section.enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>

        <button
          onClick={() => onExpandToggle(section.id)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          )}
        </button>
      </div>

      {/* Section Content Editor (Expandable) */}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Headline
                  </label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subheadline
                  </label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={section.content.button_text || ''}
                      onChange={(e) => onEdit(section.id, 'button_text', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      placeholder="Button text"
                    />
                  </div>
                  {section.content.button_link !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Button Link
                      </label>
                      <input
                        type="text"
                        value={section.content.button_link || ''}
                        onChange={(e) => onEdit(section.id, 'button_link', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="/products"
                      />
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
  
  // Site Settings State
  const [settings, setSettings] = useState({
    logo_url: '',
    site_name: 'Print Queen 3D',
    tagline: 'Custom 3D Printed Creations',
    brand_colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B'
    },
    contact_info: {
      email: '',
      phone: '',
      address: ''
    },
    social_links: {
      instagram: '',
      facebook: '',
      twitter: '',
      tiktok: '',
      youtube: ''
    },
    footer_text: 'All rights reserved.'
  });
  
  // Homepage Sections State
  const [sections, setSections] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, sectionsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/site-settings`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/admin/homepage-sections`, { withCredentials: true })
      ]);
      
      setSettings(prev => ({ ...prev, ...settingsRes.data }));
      setSections(sectionsRes.data.sections || []);
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
      await axios.put(
        `${BACKEND_URL}/api/admin/homepage-sections`,
        { sections },
        { withCredentials: true }
      );
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
        // Update order numbers
        return newItems.map((item, index) => ({ ...item, order: index + 1 }));
      });
    }
  };

  const toggleSection = (sectionId) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, enabled: !section.enabled }
          : section
      )
    );
  };

  const editSectionContent = (sectionId, field, value) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, content: { ...section.content, [field]: value } }
          : section
      )
    );
  };

  const toggleExpanded = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'sections', label: 'Homepage Sections', icon: Layout },
    { id: 'footer', label: 'Footer & Social', icon: LinkIcon }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
            ))}
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
          {saving ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
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
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Branding */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-500" />
                Branding
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Logo
                  </label>
                  <ImageUploader
                    images={settings.logo_url ? [settings.logo_url] : []}
                    onUpload={(urls) => setSettings(prev => ({ ...prev, logo_url: urls[0] || '' }))}
                    maxImages={1}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.site_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tagline
                    </label>
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
                <Palette className="h-5 w-5 text-purple-500" />
                Brand Colors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.brand_colors.primary}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        brand_colors: { ...prev.brand_colors, primary: e.target.value }
                      }))}
                      className="h-12 w-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={settings.brand_colors.primary}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        brand_colors: { ...prev.brand_colors, primary: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.brand_colors.secondary}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        brand_colors: { ...prev.brand_colors, secondary: e.target.value }
                      }))}
                      className="h-12 w-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={settings.brand_colors.secondary}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        brand_colors: { ...prev.brand_colors, secondary: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.brand_colors.accent}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        brand_colors: { ...prev.brand_colors, accent: e.target.value }
                      }))}
                      className="h-12 w-12 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={settings.brand_colors.accent}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        brand_colors: { ...prev.brand_colors, accent: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Color Preview */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-3">Preview:</p>
                <div className="flex gap-3">
                  <div
                    className="h-10 flex-1 rounded-lg shadow-sm flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: settings.brand_colors.primary }}
                  >
                    Primary
                  </div>
                  <div
                    className="h-10 flex-1 rounded-lg shadow-sm flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: settings.brand_colors.secondary }}
                  >
                    Secondary
                  </div>
                  <div
                    className="h-10 flex-1 rounded-lg shadow-sm flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: settings.brand_colors.accent }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-500" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" /> Email
                  </label>
                  <input
                    type="email"
                    value={settings.contact_info.email || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contact_info: { ...prev.contact_info, email: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="contact@yoursite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" /> Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.contact_info.phone || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contact_info: { ...prev.contact_info, phone: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" /> Address
                  </label>
                  <input
                    type="text"
                    value={settings.contact_info.address || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contact_info: { ...prev.contact_info, address: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="City, State"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'sections' && (
          <motion.div
            key="sections"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Homepage Sections</h3>
                <p className="text-sm text-slate-500">Drag to reorder, toggle visibility, edit content</p>
              </div>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sections.map((section) => (
                    <SortableSectionItem
                      key={section.id}
                      section={section}
                      onToggle={toggleSection}
                      onEdit={editSectionContent}
                      isExpanded={expandedSections[section.id]}
                      onExpandToggle={toggleExpanded}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        )}

        {activeTab === 'footer' && (
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Social Links */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Instagram className="h-4 w-4 inline mr-2" />Instagram
                  </label>
                  <input
                    type="url"
                    value={settings.social_links.instagram || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      social_links: { ...prev.social_links, instagram: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Facebook className="h-4 w-4 inline mr-2" />Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.social_links.facebook || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      social_links: { ...prev.social_links, facebook: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Twitter className="h-4 w-4 inline mr-2" />Twitter / X
                  </label>
                  <input
                    type="url"
                    value={settings.social_links.twitter || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      social_links: { ...prev.social_links, twitter: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="https://twitter.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Youtube className="h-4 w-4 inline mr-2" />YouTube
                  </label>
                  <input
                    type="url"
                    value={settings.social_links.youtube || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      social_links: { ...prev.social_links, youtube: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Footer Settings</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Footer Copyright Text
                </label>
                <input
                  type="text"
                  value={settings.footer_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, footer_text: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="© 2024 Your Company. All rights reserved."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
