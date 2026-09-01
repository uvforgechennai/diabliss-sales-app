// Single source of truth for the app version — loaded by index.html,
// mis-report.html, and sw.js (via importScripts) so there's only ever
// one number to bump instead of three that can drift out of sync.
const APP_VERSION = "1.7.180";
