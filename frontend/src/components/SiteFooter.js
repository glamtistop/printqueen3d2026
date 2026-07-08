import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSiteConfig } from '../lib/siteConfig';

const fallbackNavigationItems = [
  { id: 'home', label: 'Home', link: '/', enabled: true, show_footer: false, footer_group: 'company', order: 1 },
  { id: 'personalize', label: 'Personalize', link: '/personalize', enabled: true, show_footer: true, order: 2 },
  { id: 'shop', label: 'Shop', link: '/shop', enabled: true, show_footer: true, order: 3 },
  { id: 'design-your-own', label: 'Design Your Own', link: '/design-your-own', enabled: true, show_footer: true, order: 4 },
  { id: 'corporate-bulk', label: 'Corporate & Bulk', link: '/corporate-bulk-orders', enabled: true, show_footer: false, footer_group: 'hidden', order: 5 },
  { id: 'about', label: 'About', link: '/about', enabled: true, show_footer: true, footer_group: 'company', order: 6 },
  { id: 'contact', label: 'Contact', link: '/contact', enabled: true, show_footer: true, footer_group: 'company', order: 7 },
  { id: 'footer-personalized', label: 'Personalized Creations', link: '/personalize', enabled: true, show_footer: true, footer_group: 'shop', order: 8 },
  { id: 'footer-chains-pendants', label: 'Custom Chains & Pendants', link: '/shop', enabled: true, show_footer: true, footer_group: 'shop', order: 9 },
  { id: 'footer-nfc-business', label: 'NFC & Business Solutions', link: '/shop', enabled: true, show_footer: true, footer_group: 'shop', order: 10 },
  { id: 'footer-home-decor', label: 'Home Décor & Lithophanes', link: '/shop', enabled: true, show_footer: true, footer_group: 'shop', order: 11 },
  { id: 'footer-gifts', label: 'Gifts, Keepsakes & Celebrations', link: '/shop', enabled: true, show_footer: true, footer_group: 'shop', order: 12 },
  { id: 'footer-design-your-own', label: 'Design Your Own', link: '/design-your-own', enabled: true, show_footer: true, footer_group: 'shop', order: 13 },
  { id: 'footer-custom-order', label: 'Custom Order', link: '/design-your-own', enabled: true, show_footer: true, footer_group: 'company', order: 14 },
  { id: 'footer-corporate-bulk', label: 'Corporate & Bulk Orders', link: '/corporate-bulk-orders', enabled: true, show_footer: true, footer_group: 'company', order: 15 },
  { id: 'footer-partner-with-us', label: 'Partner With Us', link: '/contact', enabled: true, show_footer: true, footer_group: 'company', order: 16 },
  { id: 'shipping-policy', label: 'Shipping Policy', link: '/shipping-policy', enabled: true, show_footer: true, footer_group: 'support', order: 17 },
  { id: 'materials-process', label: 'Materials & 3D Printing', link: '/materials', enabled: true, show_footer: true, footer_group: 'support', order: 18 },
  { id: 'refund-policy', label: 'Refund Policy', link: '/refund-policy', enabled: true, show_footer: true, footer_group: 'support', order: 19 },
  { id: 'product-care', label: 'Product Care', link: '/product-care', enabled: true, show_footer: true, footer_group: 'support', order: 20 },
  { id: 'privacy', label: 'Privacy Policy', link: '/privacy-policy', enabled: true, show_footer: true, footer_group: 'support', order: 21 },
  { id: 'terms', label: 'Terms of Service', link: '/terms-of-service', enabled: true, show_footer: true, footer_group: 'support', order: 22 },
];

const policyLinks = {
  'refund-policy': '/refund-policy',
  'product-care': '/product-care',
  privacy: '/privacy-policy',
  'privacy-policy': '/privacy-policy',
  terms: '/terms-of-service',
  'terms-of-service': '/terms-of-service',
  'shipping-policy': '/shipping-policy',
};

const getFooterLink = (item) => {
  const savedLink = item.link || '#';
  if (savedLink && savedLink !== '#') return savedLink;
  if (policyLinks[item.id]) return policyLinks[item.id];
  if (item.label === 'Refund Policy') return '/refund-policy';
  if (item.label === 'Product Care') return '/product-care';
  if (item.label === 'Privacy Policy') return '/privacy-policy';
  if (item.label === 'Terms of Service') return '/terms-of-service';
  if (item.label === 'Shipping Policy') return '/shipping-policy';
  if (item.label === 'Materials & 3D Printing') return '/materials';
  return item.link || '#';
};

const dedupeFooterItems = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (item.id === 'corporate-bulk') return false;
    const key = `${item.label || ''}|${getFooterLink(item)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const SiteFooter = ({ siteConfig }) => {
  const [config, setConfig] = useState(siteConfig || null);

  useEffect(() => {
    if (siteConfig) {
      setConfig(siteConfig);
      return;
    }

    const fetchConfig = async () => {
      try {
        setConfig(await fetchSiteConfig());
      } catch (error) {
        setConfig({ settings: {} });
      }
    };
    fetchConfig();
  }, [siteConfig]);

  const settings = config?.settings || {};
  const contactInfo = settings.contact_info || {};
  const socialLinks = settings.social_links || {};
  const contactEmail = contactInfo.email || 'printqueen3d@gmail.com';
  const contactPhone = contactInfo.phone || '(310) 936-1893';
  const locationText = settings.footer_location_text || contactInfo.address || settings.footer_pickup_text || 'Los Angeles, California';
  const instagramLink = socialLinks.instagram || 'https://instagram.com/printqueen3d';
  const tiktokLink = socialLinks.tiktok || 'https://www.tiktok.com/@printqueen3d';
  const xLink = socialLinks.twitter || 'https://x.com/printqueen3d';
  const navItems = (settings.navigation_items?.length ? settings.navigation_items : fallbackNavigationItems)
    .filter((item) => item.enabled && item.show_footer)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const shopItems = dedupeFooterItems(navItems.filter((item) => item.footer_group === 'shop'));
  const companyItems = dedupeFooterItems(navItems.filter((item) => (item.footer_group || (policyLinks[item.id] ? 'support' : 'company')) === 'company'));
  const supportItems = dedupeFooterItems(navItems.filter((item) => (item.footer_group || (policyLinks[item.id] ? 'support' : 'company')) === 'support'));
  const footerStyle = {
    backgroundColor: settings.footer_background_color || undefined,
    color: settings.footer_text_color || undefined,
    fontSize: settings.footer_text_size || undefined,
    paddingTop: settings.footer_padding_y ? `${settings.footer_padding_y}px` : undefined
  };

  const renderLink = (item, className = '') => {
    const link = getFooterLink(item);
    return link.startsWith('http') || link.startsWith('#') ? (
      <a href={link} className={className}>{item.label}</a>
    ) : (
      <Link to={link} className={className}>{item.label}</Link>
    );
  };

  return (
    <footer id="contact" className="site-footer scroll-mt-28" style={footerStyle}>
      <div className="footer-content">
        <div className="footer-section">
          <img
            src={settings.logo_url || "/printqueen-logo.png"}
            alt={settings.site_name || "Print Queen 3D"}
            className="h-16 w-auto mb-4"
          />
          <p className="text-gray-400 text-sm mb-4">
            {settings.footer_description || 'Professionally 3D printed custom creations made to order with precision and care.'}
          </p>
          <p className="text-gray-400 text-sm mb-4">
            <strong>{settings.footer_contact_title || 'Contact'}:</strong><br />
            {locationText}
          </p>
          <p className="text-gray-300">
            <a href={`tel:${contactPhone.replace(/[^0-9]/g, '')}`} className="hover:text-blue-400">{contactPhone}</a><br />
            <a href={`mailto:${contactEmail}`} className="hover:text-blue-400">
              {contactEmail}
            </a>
            <br />
            <a href="https://printqueen3d.com" className="hover:text-blue-400">PrintQueen3D.com</a>
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition-colors">{settings.footer_instagram_label || 'Instagram: @printqueen3d'}</a>
            <a href={tiktokLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-300 transition-colors">{settings.footer_tiktok_label || 'TikTok: @printqueen3d'}</a>
            <a href={xLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-400 transition-colors">{settings.footer_x_label || 'X: @printqueen3d'}</a>
            {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">Facebook</a>}
            {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">YouTube</a>}
          </div>
        </div>

        <div className="footer-section">
          <h3>{settings.footer_shop_title || 'Shop'}</h3>
          <ul className="footer-links">
            {shopItems.map((item) => (
              <li key={item.id || item.label}>{renderLink(item)}</li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h3>{settings.footer_company_title || settings.footer_links_title || 'Company'}</h3>
          <ul className="footer-links">
            {companyItems.map((item) => (
              <li key={item.id || item.label}>{renderLink(item)}</li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h3>{settings.footer_support_title || settings.footer_policies_title || 'Support'}</h3>
          <ul className="footer-links">
            {supportItems.map((item) => (
              <li key={item.id || item.label}>{renderLink(item)}</li>
            ))}
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 {settings.site_name || 'Print Queen 3D'}. {settings.footer_text || 'All rights reserved.'}</p>
        <p className="text-sm text-gray-400 mt-2">Made to order in Los Angeles · Fast, reliable shipping · Local pickup available</p>
      </div>
    </footer>
  );
};

export default SiteFooter;
