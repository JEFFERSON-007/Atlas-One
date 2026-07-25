# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] — 2026-07-24

### Added

- **Interactive 3D Globe** — Full CesiumJS-powered photorealistic Earth
- **Cinematic Landing** — GSAP-animated fade-from-black → camera approach → UI reveal
- **Globe System** — Terrain (Cesium World Terrain), imagery (Bing Maps / OSM fallback), atmosphere, clouds, day/night cycle
- **Space Environment** — Star field, sun, moon, dynamic lighting
- **Camera Controls** — Orbit, fly-to, zoom, keyboard (WASD/arrows), double-click zoom, auto-rotate
- **Location Search** — OpenStreetMap Nominatim geocoding with debounced input, results dropdown, fly-to, and marker
- **Layer System** — Modular registry with 6 toggleable layers (Satellite, Terrain, Clouds, Borders, Cities, Grid)
- **Dark Glassmorphism UI** — Toolbar, search panel, layers panel, settings panel, coordinates display, FPS counter
- **Settings** — Graphics quality (Low/Medium/High/Ultra), FPS toggle, auto-rotate, terrain toggle, cloud toggle, animation speed
- **Accessibility** — ARIA labels, keyboard navigation, focus states, reduced motion support, high contrast
- **Error Handling** — Global error boundary, API retry with backoff, graceful degradation for missing tokens
- **Performance** — Debounce, throttle, lazy resources, quality presets, chunk splitting
- **Responsive Design** — Desktop, laptop, tablet, mobile, and ultra-wide layouts
- **Security** — Input sanitization, no eval, no inline scripts, safe URL handling, CSP guidance
- **Testing** — Vitest unit tests for utilities and config
- **CI/CD** — GitHub Actions workflow for automated build and deploy to GitHub Pages
- **Future-Ready Stubs** — USGS Earthquake API adapter, Open-Meteo weather adapter, extensible layer system
