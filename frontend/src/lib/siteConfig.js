// Caches /api/site-config for the lifetime of one page load so Navbar, Footer,
// and page components don't each fetch it separately. Module state resets on a
// full page reload, so admin edits always appear after a refresh.
let cached = null;
let inFlight = null;

export const fetchSiteConfig = ({ fresh = false } = {}) => {
  if (cached && !fresh) return Promise.resolve(cached);
  if (inFlight && !fresh) return inFlight;
  inFlight = fetch(
    `${process.env.REACT_APP_BACKEND_URL}/api/site-config`,
    fresh ? { cache: 'no-store' } : undefined
  )
    .then((response) => response.json())
    .then((data) => {
      cached = data;
      inFlight = null;
      return data;
    })
    .catch((error) => {
      inFlight = null;
      throw error;
    });
  return inFlight;
};
