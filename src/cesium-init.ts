/**
/**
 * Initializes Cesium global variables before any Cesium modules are imported.
 * Vite replaces CESIUM_BASE_URL at build time based on the base path.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(window as any).CESIUM_BASE_URL = CESIUM_BASE_URL;
