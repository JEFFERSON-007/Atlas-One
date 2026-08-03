<div align="center">

# 🌍 Atlas One

### The Next Generation Earth Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CesiumJS](https://img.shields.io/badge/CesiumJS-1.122-6CADDF?logo=cesium&logoColor=white)](https://cesium.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

*A fully interactive photorealistic 3D Earth running entirely in the browser.*

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌍 **Earth Event Engine** | Generic, reusable real-time natural event monitoring system |
| 🌋 **6 Live Data Providers** | USGS Earthquakes, NASA Wildfires, Smithsonian Volcanoes, Blitzortung Lightning, NOAA Storms, GDACS Tsunamis |
| 📊 **Earth Intelligence Dashboard** | Real-time stat cards, severity breakdown bars, and critical alert highlights |
| 📍 **Severity Markers & Animation** | SVG data URI markers with color/size severity coding and pulse animation rings |
| 🌡️ **Offscreen Heatmap Layer** | GPU-optimized canvas density heatmap overlay |
| 🧩 **Spatial Clustering** | Zoom-aware grid clustering with severity aggregation |
| 📋 **Event List & Detail Panels** | Grouped, sortable event list + full GIS metadata detail panel with location sharing |
| 🔍 **Universal Filter System** | Search keywords, event types, and severity level filtering |
| ⏱️ **Event Timeline Strip** | Bottom temporal control bar for time-series visualization |
| 🌐 **Interactive 3D Globe** | Photorealistic Earth with high-res terrain, atmosphere glow, and HDR lighting |
| 🌤️ **Live Weather System** | Pluggable weather architecture powered by Open-Meteo |
| ℹ️ **Information Panel** | Click any globe location for geocoded address, live weather metrics & local time |
| ☁️ **Global Cloud Overlay** | Real MODIS cloud coverage via NASA GIBS imagery |
| 🗂️ **Modular Layer Manager** | Satellite imagery, terrain, clouds, atmosphere, day/night, events, heatmaps |

---

## 🏗️ Architecture

```
src/
├── config/                  # App & Cesium configuration & quality presets
├── core/engine/             # Scene, Camera, Lighting, Animation
│   ├── camera/
│   ├── lighting/
│   ├── scene/
│   └── animation/
├── globe/                   # Earth rendering subsystems
│   ├── terrain/
│   ├── imagery/providers/
│   ├── clouds/              # NASA GIBS MODIS cloud layer
│   └── atmosphere/          # Sky scattering & depth fog
├── layers/                  # Modular layer system
│   └── implementations/     # Imagery, terrain, clouds, atmosphere, day/night, etc.
├── api/                     # HTTP client & service adapters
│   ├── providers/           # Pluggable Weather providers (Open-Meteo)
│   ├── services/            # Weather service with 30s TTL cache & deduplication
│   └── adapters/            # Nominatim, Weather adapter facade
├── ui/                      # Glassmorphism UI components
│   └── components/
│       ├── toolbar/
│       └── panels/          # Search, Layers, Settings, InfoPanel, Coordinates, FPS
├── hooks/                   # Event bus
├── utils/                   # Debounce, throttle, DOM, validators, logger
├── styles/                  # CSS design system & glassmorphism tokens
├── types/                   # TypeScript declarations
└── main.ts                  # Bootstrap entry point
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Atlas-one.git
cd Atlas-one

# Install dependencies
npm install

# (Optional) Configure API keys
cp .env.example .env
# Edit .env with your Cesium Ion token
```

### Development

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build
```

### Testing & Quality

```bash
npm run test         # Run unit tests
npm run type-check   # TypeScript type checking
npm run lint         # ESLint
npm run format       # Prettier formatting
```

---

## 🔑 API Configuration

Atlas One uses environment variables for API keys. Copy `.env.example` to `.env`:

| Variable | Required | Description |
|---|---|---|
| `VITE_CESIUM_ION_TOKEN` | Recommended | Enables terrain and premium imagery. [Get free token →](https://ion.cesium.com/tokens) |
| `VITE_OPENWEATHER_API_KEY` | No | Future: weather layer |
| `VITE_MAPTILER_API_KEY` | No | Future: alternative map tiles |

> **Without a Cesium Ion token**, the app runs with OpenStreetMap tiles and flat terrain — fully functional, but less visually impressive.

---

## 🌐 Deployment (GitHub Pages)

### Automatic Deployment

Push to `main` and GitHub Actions will automatically build and deploy:

1. Go to your repo → **Settings** → **Pages**
2. Set Source to **GitHub Actions**
3. Push to `main` — the workflow handles the rest

### Manual Deployment

```bash
npm run build
# Upload the `dist/` folder to your hosting provider
```

### Custom Base Path

If your repo name differs from `Atlas-One`, update `vite.config.ts`:

```ts
const basePath = '/your-repo-name/';
```

---

## 🎨 UI Design

Atlas One uses a **premium dark glassmorphism** design:

- **Dark palette**: Deep navy backgrounds with subtle glass blur
- **Glassmorphism panels**: Frosted glass with backdrop blur
- **Curated color system**: Blue accents, cyan coordinates, green FPS
- **Inter font**: Modern, professional typography
- **Smooth micro-animations**: All transitions use cubic-bezier easing
- **Responsive**: Adapts seamlessly from mobile to ultra-wide

---

## 🔮 Future Roadmap

| Module | Status |
|---|---|
| Weather Layer | 🔲 Stub ready |
| Earthquake Layer | 🔲 Stub ready |
| Flight Tracking | 🔲 Planned |
| Ship Tracking | 🔲 Planned |
| Satellite Orbits | 🔲 Planned |
| Wildfire Detection | 🔲 Planned |
| Volcano Monitoring | 🔲 Planned |
| AI Assistant | 🔲 Planned |
| Historical Timeline | 🔲 Planned |
| Analytics Dashboard | 🔲 Planned |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards (TypeScript strict, ESLint, Prettier)
4. Write tests for new utilities
5. Commit with conventional commits: `feat: add weather layer`
6. Push and open a Pull Request

### Coding Standards

- TypeScript **strict mode** — no `any` unless justified
- **ES Modules** — named imports only
- **SOLID principles** — especially Open-Closed for the layer system
- **No console.log** in production — use `createLogger()`
- **Document** all public functions with JSDoc
- **No hardcoded secrets** — use environment variables

---

## 📄 License

[MIT](./LICENSE) — free for personal and commercial use.

---

<div align="center">

**Built with ❤️ for Earth Intelligence**

*Atlas One v0.1*

</div>
