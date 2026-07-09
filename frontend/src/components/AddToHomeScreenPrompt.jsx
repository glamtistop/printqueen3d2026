import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Share, Smartphone } from 'lucide-react';

const AddToHomeScreenPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const promptRef = useRef(null);

  // Publish this prompt's visibility + measured height to <body> so the floating
  // Support widget button can lift itself above the prompt (no overlap on mobile).
  useEffect(() => {
    const body = document.body;
    if (!showPrompt) {
      body.classList.remove('pq-a2hs-visible');
      body.style.removeProperty('--pq-a2hs-height');
      return;
    }
    const measure = () => {
      const height = promptRef.current?.offsetHeight || 0;
      body.style.setProperty('--pq-a2hs-height', `${height}px`);
      body.classList.add('pq-a2hs-visible');
    };
    const raf = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(raf);
      body.classList.remove('pq-a2hs-visible');
      body.style.removeProperty('--pq-a2hs-height');
    };
  }, [showPrompt]);

  // Detect device type on mount (static - won't change)
  const deviceInfo = useMemo(() => {
    if (typeof window === 'undefined') return { isIOS: false, isAndroid: false };
    const userAgent = window.navigator.userAgent.toLowerCase();
    return {
      isIOS: /iphone|ipad|ipod/.test(userAgent) && !window.MSStream,
      isAndroid: /android/.test(userAgent)
    };
  }, []);

  useEffect(() => {
    // Check if already installed or dismissed
    const dismissed = localStorage.getItem('a2hs_dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (dismissed || isStandalone) {
      return;
    }

    // For Android/Chrome - capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a delay (let user browse first)
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS - show manual instructions after delay
    if (deviceInfo.isIOS) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [deviceInfo.isIOS]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('a2hs_dismissed', 'true');
  };

  // Only show on mobile devices
  if (!deviceInfo.isIOS && !deviceInfo.isAndroid && !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          ref={promptRef}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-emerald-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">Add to Home Screen</h3>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-slate-600 mb-4">
                Install our app for quick access and a better shopping experience!
              </p>

              {deviceInfo.isIOS ? (
                // iOS Instructions
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Share className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-700">
                      Tap the <strong>Share</strong> button in Safari
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Plus className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-sm text-slate-700">
                      Select <strong>Add to Home Screen</strong>
                    </p>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                // Android/Chrome Install Button
                <div className="space-y-3">
                  <button
                    onClick={handleInstall}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Install App
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="w-full py-2 px-4 text-slate-500 text-sm hover:text-slate-700 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddToHomeScreenPrompt;
