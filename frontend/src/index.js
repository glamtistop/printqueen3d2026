import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Kill any service worker left over from older deployments. A stale service
// worker can keep serving an outdated, broken copy of the site forever —
// especially in Safari and for customers who added the site to their home
// screen. This app does not use a service worker, so unregister everything
// and clear its caches so customers always load the current version.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    })
    .catch(() => {});
  if (window.caches?.keys) {
    caches.keys()
      .then((keys) => keys.forEach((key) => caches.delete(key)))
      .catch(() => {});
  }
}

// Safari restores pages from the back/forward cache as a frozen snapshot,
// which can show stale prices, products, or a broken half-loaded state when
// the customer returns after closing or force quitting. Reload once so they
// always see the current live page.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
