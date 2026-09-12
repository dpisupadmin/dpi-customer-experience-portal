/* DPI Customer Experience Portal - runtime configuration
 * No Google Apps Script dependency.
 *
 * When frontend + backend are deployed together on Vercel, leave apiBaseUrl blank.
 * The browser will call the same origin, e.g. /api/rpc.
 *
 * If the frontend remains on GitHub Pages while the standalone API is deployed
 * elsewhere, set apiBaseUrl to the standalone API origin, e.g.
 * https://dpi-customer-experience-portal.vercel.app
 */
window.DPI_CONFIG = Object.freeze({
  apiBaseUrl: '',
  apiTimeoutMs: 30000
});
