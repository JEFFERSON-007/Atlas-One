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
| 🚀 **Global Mobility Engine** | Live tracking of flights (OpenSky), satellites (CelesTrak), ISS, and ships (AIS) |
| 🤖 **AI Intelligence Engine** | Natural language spatial querying and LLM-powered context analysis |
| 🛰️ **Orbital Mechanics** | Real-time SGP4 TLE orbital path propagation & 3D motion trails |
| 🏢 **Digital Twin Layer** | 3D Buildings (OSM), global country borders, rivers, lakes, and city labels |
| 🌋 **6 Live Data Providers** | USGS Earthquakes, NASA Wildfires, Smithsonian Volcanoes, Blitzortung Lightning, NOAA Storms, GDACS Tsunamis |
| 📊 **Earth Intelligence Dashboard** | Real-time stat cards, severity breakdown bars, and critical alert highlights |
| 📍 **Severity Markers & Animation** | SVG data URI markers with color/size severity coding and pulse animation rings |
| 🌡️ **Offscreen Heatmap Layer** | GPU-optimized canvas density heatmap overlay |
| 🧩 **Spatial Clustering** | Zoom-aware grid clustering with severity aggregation |
| 📋 **Event List & Detail Panels** | Grouped, sortable event list + full GIS metadata detail panel with location sharing |
| 🔍 **Universal Filter System** | Search keywords, event types, and severity level filtering |
| ⏱️ **Event Timeline Strip** | Bottom temporal control bar for time-series visualization |
| 🌐 **Interactive 3D Globe** | Photorealistic Earth with high-res terrain, atmosphere glow, and HDR lighting |
| ☁️ **Global Cloud Overlay** | Real MODIS cloud coverage via NASA GIBS imagery |
| 🗂️ **Modular Layer Manager** | Satellite imagery, terrain, clouds, atmosphere, day/night, events, heatmaps |

---

## 🏗️ Architecture

```
src/
├── config/                  # App & Cesium configuration & quality presets
├── core/engine/             # Scene, Camera, Lighting, Animation
├── twin/                    # Digital Twin engine (Buildings, Borders, Hydrology, Cities)
├── mobility/                # Live tracking (Satellites, ISS, Flights, Ships, Orbits, Trails)
├── events/                  # Natural event tracking (Earthquakes, Volcanoes, Storms)
├── globe/                   # Earth rendering subsystems (Terrain, Imagery, Clouds, Atmosphere)
├── layers/                  # Modular layer system (Toggleable map features)
├── ui/                      # Glassmorphism UI components (Dashboards, Panels, Overlays)
├── hooks/                   # Event bus
├── utils/                   # Debounce, throttle, DOM, validators, logger
├── styles/                  # CSS design system & glassmorphism tokens
├── types/                   # TypeScript declarations
└── main.ts                  # Bootstrap entry point
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+ (Required for `@cesium/engine`)
- [npm](https://www.npmjs.com/) 10+

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
| `VITE_CESIUM_ION_TOKEN` | Recommended | Enables terrain and 3D buildings. [Get free token →](https://ion.cesium.com/tokens) |
| `VITE_OPENWEATHER_API_KEY` | No | Future: weather layer |
| `VITE_MAPTILER_API_KEY` | No | Future: alternative map tiles |

> **Without a Cesium Ion token**, the app runs with OpenStreetMap tiles, flat terrain, and no 3D buildings — fully functional, but less visually immersive.

---

## 🌐 Deployment (GitHub Pages)

### Automatic Deployment

Push to `main` and GitHub Actions will automatically build and deploy:

1. Go to your repo → **Settings** → **Pages**
2. Set Source to **GitHub Actions**
3. Push to `main` — the workflow handles the rest

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
| Weather Radar Overlay | 🔲 Planned |
| Cyber Threat Map | 🔲 Planned |
| Historical Timeline Slider | 🔲 Planned |
| Submarine Cable Network | 🔲 Planned |
| Mobile Companion App | 🔲 Planned |

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

*Atlas One v0.5.0*

</div>
