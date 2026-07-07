import React, { useId } from 'react';

const visualPresets = {
  personalized: {
    title: 'Name Keychains',
    chips: ['RAENYA', 'PHOTO', 'CHARM'],
    accent: '#06b6d4',
    glow: '#ec4899',
  },
  business: {
    title: 'Tap + Scan',
    chips: ['NFC', 'QR', 'PAY'],
    accent: '#14b8a6',
    glow: '#2563eb',
  },
  keychains: {
    title: 'Custom Charms',
    chips: ['NFC', 'MUSIC', 'NAME'],
    accent: '#0891b2',
    glow: '#a855f7',
  },
  keepsakes: {
    title: 'Keepsakes',
    chips: ['PHOTO', 'PLAQUE', 'GIFT'],
    accent: '#0ea5e9',
    glow: '#f97316',
  },
  decor: {
    title: 'Home Glow',
    chips: ['LAMP', 'VASE', 'DECOR'],
    accent: '#10b981',
    glow: '#f59e0b',
  },
  fidgets: {
    title: 'Fidgets',
    chips: ['DRAGON', 'FLEXI', 'TOY'],
    accent: '#22c55e',
    glow: '#3b82f6',
  },
  celebrations: {
    title: 'Special Days',
    chips: ['GRAD', 'BABY', 'EVENT'],
    accent: '#ec4899',
    glow: '#06b6d4',
  },
  design: {
    title: 'Idea to Print',
    chips: ['SKETCH', 'MODEL', 'PRINT'],
    accent: '#6366f1',
    glow: '#10b981',
  },
  nfcPayment: {
    title: 'Tap to Pay',
    chips: ['NFC', 'PAY', 'SCAN'],
    accent: '#06b6d4',
    glow: '#22c55e',
  },
  nfcBusiness: {
    title: 'Business Display',
    chips: ['CARD', 'NFC', 'QR'],
    accent: '#0ea5e9',
    glow: '#14b8a6',
  },
  nfcKeychain: {
    title: 'Tap Keychain',
    chips: ['NFC', 'TAP', 'LINK'],
    accent: '#14b8a6',
    glow: '#a855f7',
  },
  lithophane: {
    title: 'Photo Lamp',
    chips: ['PHOTO', 'LIGHT', 'GIFT'],
    accent: '#f59e0b',
    glow: '#06b6d4',
  },
  vase: {
    title: 'Modern Vase',
    chips: ['VASE', 'DECOR', 'PRINT'],
    accent: '#10b981',
    glow: '#0ea5e9',
  },
  qrStand: {
    title: 'QR Stand',
    chips: ['QR', 'SCAN', 'SHOP'],
    accent: '#2563eb',
    glow: '#10b981',
  },
  barber: {
    title: 'Barber Stand',
    chips: ['BOOK', 'TAP', 'PAY'],
    accent: '#ef4444',
    glow: '#06b6d4',
  },
  music: {
    title: 'Tap to Stream',
    chips: ['VINYL', 'NFC', 'MUSIC'],
    accent: '#a855f7',
    glow: '#06b6d4',
  },
  nameplate: {
    title: 'RAENYA',
    chips: ['NAME', 'SIGN', 'CUSTOM'],
    accent: '#ec4899',
    glow: '#10b981',
  },
};

const inferPreset = (label = '') => {
  const text = label.toLowerCase();
  if (text.includes('business card')) return 'nfcBusiness';
  if (text.includes('payment') || text.includes('tap-to-pay') || text.includes('tap to pay')) return 'nfcPayment';
  if (text.includes('barber')) return 'barber';
  if (text.includes('vinyl') || text.includes('music') || text.includes('spotify') || text.includes('stream')) return 'music';
  if (text.includes('qr')) return 'qrStand';
  if (text.includes('nfc') && text.includes('keychain')) return 'nfcKeychain';
  if (text.includes('nfc') || text.includes('business')) return 'business';
  if (text.includes('lithophane') || text.includes('lamp') || text.includes('night')) return 'lithophane';
  if (text.includes('vase')) return 'vase';
  if (text.includes('nameplate') || text.includes('raenya')) return 'nameplate';
  if (text.includes('keychain') || text.includes('charm')) return 'keychains';
  if (text.includes('gift') || text.includes('keepsake') || text.includes('memorial')) return 'keepsakes';
  if (text.includes('decor') || text.includes('décor') || text.includes('home')) return 'decor';
  if (text.includes('fidget') || text.includes('fun') || text.includes('toy') || text.includes('dragon')) return 'fidgets';
  if (text.includes('celebration') || text.includes('occasion') || text.includes('event') || text.includes('wedding') || text.includes('graduation')) return 'celebrations';
  if (text.includes('design your own') || text.includes('custom project')) return 'design';
  if (text.includes('personalized') || text.includes('name')) return 'personalized';
  return 'design';
};

const MockProductVisual = ({ label, className = '' }) => {
  const preset = visualPresets[inferPreset(label)];
  const { title, chips, accent, glow } = preset;
  const instanceId = useId().replace(/[^a-z0-9]+/gi, '-');
  const safeId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${instanceId}`;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-slate-950 ${className}`}
      role="img"
      aria-label={`${label || title} mock product visual`}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`glow-${safeId}`} cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.45" />
            <stop offset="48%" stopColor={accent} stopOpacity="0.14" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </radialGradient>
          <linearGradient id={`card-${safeId}`} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#ccfbf1" />
          </linearGradient>
          <linearGradient id={`rainbow-${safeId}`} x1="0%" x2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="35%" stopColor={accent} />
            <stop offset="70%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id={`shadow-${safeId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>
        <rect width="800" height="600" fill={`url(#glow-${safeId})`} />
        <ellipse cx="400" cy="510" rx="330" ry="58" fill="#020617" opacity="0.48" />
        <rect x="105" y="430" width="590" height="62" rx="28" fill="#0f172a" opacity="0.95" filter={`url(#shadow-${safeId})`} />
        <rect x="135" y="415" width="530" height="38" rx="19" fill={`url(#rainbow-${safeId})`} opacity="0.9" />

        <g filter={`url(#shadow-${safeId})`}>
          <rect x="110" y="162" width="190" height="240" rx="34" fill="#111827" stroke={accent} strokeWidth="7" />
          <rect x="135" y="190" width="140" height="150" rx="22" fill="#020617" stroke={`url(#rainbow-${safeId})`} strokeWidth="5" />
          <path d="M182 248 Q205 225 228 248" stroke={accent} strokeWidth="10" fill="none" strokeLinecap="round" />
          <circle cx="205" cy="278" r="18" fill={accent} opacity="0.9" />
          <rect x="155" y="354" width="100" height="22" rx="11" fill="#f8fafc" opacity="0.9" />
        </g>

        <g filter={`url(#shadow-${safeId})`}>
          <rect x="330" y="118" width="180" height="270" rx="28" fill={`url(#card-${safeId})`} />
          <rect x="362" y="145" width="116" height="74" rx="16" fill="#ffffff" opacity="0.88" />
          <circle cx="420" cy="182" r="28" fill={glow} opacity="0.68" />
          <rect x="364" y="246" width="112" height="14" rx="7" fill={accent} opacity="0.85" />
          <rect x="350" y="280" width="140" height="14" rx="7" fill="#0f172a" opacity="0.68" />
          <rect x="375" y="314" width="90" height="42" rx="21" fill={`url(#rainbow-${safeId})`} opacity="0.9" />
        </g>

        <g filter={`url(#shadow-${safeId})`}>
          <path d="M585 155 C645 185 660 300 605 380 C560 340 552 232 585 155Z" fill="#ecfeff" stroke={accent} strokeWidth="7" />
          <path d="M608 168 C552 210 555 328 608 376" fill="none" stroke={glow} strokeWidth="14" opacity="0.58" />
          <rect x="540" y="385" width="130" height="50" rx="20" fill="#0f172a" />
          <rect x="565" y="400" width="80" height="14" rx="7" fill={accent} />
        </g>

        <g>
          <rect x="185" y="82" width="430" height="58" rx="29" fill="#ffffff" opacity="0.93" />
          <text x="400" y="121" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="34" fontWeight="800" fill="#0f172a">{title}</text>
        </g>

        <g>
          {chips.map((chip, index) => (
            <g key={chip}>
              <rect x={178 + index * 150} y="505" width="118" height="34" rx="17" fill="#ffffff" opacity="0.92" />
              <text x={237 + index * 150} y="528" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="800" fill="#0f172a">{chip}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default MockProductVisual;
