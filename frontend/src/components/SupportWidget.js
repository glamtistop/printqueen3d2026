import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSiteConfig } from '../lib/siteConfig';

// Built-in Instant Answers. These are also seeded into site-config as the
// `support_faq` section, so they are editable/reorderable from the admin Site
// Editor. This fallback guarantees the widget still works before the backend
// deploy lands (or if site-config is briefly unavailable).
const FALLBACK_FAQ = [
  { question: 'How do custom 3D prints work?', answer: 'Choose the product you want, add your customization details, select your colors and options, then place your order. If extra details are needed, we will contact you before printing.' },
  { question: 'How long does my order take?', answer: 'Turnaround time depends on the item, size, quantity, and customization details. Most custom items are made after the order is placed, so please allow time for design, printing, and finishing.' },
  { question: 'Can I request a custom design?', answer: 'Yes. You can request a custom design by adding your idea, name, colors, size, and any reference details. We will review the request and let you know if anything else is needed.' },
  { question: 'How does an NFC tap-to-pay stand work?', answer: 'NFC tap-to-pay stands can be programmed with your payment link, website, social media, menu, booking page, or other link. Customers tap their compatible phone near the stand and the link opens automatically.' },
  { question: 'How NFC keychain works?', answer: 'An NFC keychain has a small NFC chip inside. We program it with your link, such as your website, social media, payment link, contact card, or phone number. We program it, and you just need to tap your phone near the keychain for your link to pop up.\nIt works with iOS (top of the phone) and Android (usually middle back of the phone).' },
  { question: 'Track my order?', answer: 'Once your order is placed, you will receive order updates through the contact information provided at checkout. If tracking is available for your order, the tracking information will be sent once your package ships.' },
  { question: 'Can I reprogram/change the link?', answer: 'Yes, of course you can! With every one of our NFC products, we provide information on how to reprogram your tag if anything changes. If the NFC chip was locked for security, it may not be editable.' },
  { question: 'Do you offer bulk orders?', answer: 'Yes. Bulk orders are available for events, businesses, gifts, party favors, and custom product runs. Please include the quantity, deadline, and design details when requesting a bulk order.' },
];

const SupportWidget = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null); // selected FAQ index, or null for the list
  const [config, setConfig] = useState(null);

  // Load the admin-editable support_faq content only when the panel is first
  // opened, so it never adds weight to the initial page load.
  useEffect(() => {
    if (!open || config) return;
    let cancelled = false;
    fetchSiteConfig()
      .then((data) => {
        if (cancelled) return;
        const section = (data?.homepage_sections || []).find((s) => s.id === 'support_faq');
        setConfig(section?.content || {});
      })
      .catch(() => {
        if (!cancelled) setConfig({});
      });
    return () => { cancelled = true; };
  }, [open, config]);

  const content = config || {};
  const faqItems = (Array.isArray(content.faq_items) && content.faq_items.length
    ? content.faq_items
    : FALLBACK_FAQ
  ).filter((item) => item && item.question);
  const signupText = content.signup_text || 'Sign up for updates';
  const signupLink = content.signup_link || '/contact';

  const closePanel = () => { setOpen(false); setActive(null); };

  const IconChat = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );

  const selected = active != null ? faqItems[active] : null;

  return (
    <div className="pq-support-root">
      {open ? (
        <div className="pq-support-panel" role="dialog" aria-modal="false" aria-label="Print Queen 3D support">
          <div className="pq-support-header">
            <div className="pq-support-brand">
              <img src="/printqueen-logo.png" alt="Print Queen 3D" />
              <div>
                <div className="pq-support-title">Print Queen 3D</div>
                <div className="pq-support-subtitle">{content.subheadline || 'Chat with us'}</div>
              </div>
            </div>
            <button type="button" className="pq-support-close" onClick={closePanel} aria-label="Close support">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="pq-support-tab">{IconChat}{content.headline || 'Instant Answers'}</div>

          <div className="pq-support-body">
            {selected ? (
              <div>
                <button type="button" className="pq-support-back" onClick={() => setActive(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back to Instant Answers
                </button>
                <div className="pq-support-answer-q">{selected.question}</div>
                <div className="pq-support-answer-a">{selected.answer}</div>
                {signupLink.startsWith('/') ? (
                  <Link to={signupLink} className="pq-support-signup" onClick={closePanel}>{signupText}</Link>
                ) : (
                  <a href={signupLink} className="pq-support-signup" target="_blank" rel="noopener noreferrer">{signupText}</a>
                )}
              </div>
            ) : (
              <div>
                <p className="pq-support-hint">Tap a question for an instant answer.</p>
                {faqItems.map((item, index) => (
                  <button type="button" key={index} className="pq-support-qbtn" onClick={() => setActive(index)}>
                    <span>{item.question}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button type="button" className="pq-support-btn" onClick={() => setOpen(true)} aria-label="Open support">
          {IconChat}
          Support
        </button>
      )}
    </div>
  );
};

export default SupportWidget;
