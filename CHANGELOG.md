# Changelog

All notable changes to the **Atlas One** Earth Intelligence Platform project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - Global Mobility & Space Intelligence Platform - 2026-08-06

### Added
- **Dynamic Object Engine Core**: Universal, unified engine orchestrating real-time tracking, interpolation, deduplication, and viewport rendering for all moving objects across Earth and space.
- **4 Mobility & Orbital Data Providers**:
  - **OpenSky Network Aircraft**: Live worldwide commercial and private flight tracking with altitude, ground speed, callsign, and origin country.
  - **CelesTrak Satellite Tracker**: Orbital mechanics propagation (SGP4/SDP4 via `satellite.js`) for active satellites across LEO, MEO, GEO, and HEO.
  - **WhereTheISS Live Tracker**: Real-time International Space Station telemetry, altitude, velocity, and ground footprint tracking.
  - **AIS Vessel Tracker**: Simulated real-world maritime vessel movement across 12 major global shipping lanes (Suez, Panama, Malacca, North Atlantic, etc.).
- **Rendering Subsystem**:
  - **Object Renderer**: Entity pooling, altitude-aware positioning, heading-based billboard rotation, and LOD frustum culling.
  - **Trail Engine**: GPU-optimized polyline motion trails for aircraft contrails, ship wakes, and ground tracks.
  - **Orbit Engine**: 3D orbital trajectory rendering generated via SGP4 propagation.
  - **Mobility Marker Factory**: Vector SVG marker generator for rotatable aircraft silhouettes, ship hulls, glowing satellite dots, and ISS station icons.
- **8 Mobility Layer Implementations**:
  - `FlightsLayer` (OpenSky Aircraft)
  - `ShipsLayer` (Maritime Vessels)
  - `SatellitesLayer` (Active Satellites)
  - `ISSLayer` (Space Station)
  - `StarlinkLayer` (Constellation)
  - `GPSConstellationLayer` (GNSS - GPS, GLONASS, Galileo, BeiDou)
  - `OrbitPathsLayer` (3D Orbit Trajectories)
  - `TrailsLayer` (Vehicle Motion Trails)
- **4 Mobility UI Panels**:
  - **Object Detail Panel**: Full telemetry, position, heading, altitude, speed, metadata inspection, and camera follow/focus controls.
  - **Object List Panel**: Filterable, sortable list of active aircraft, ships, and satellites.
  - **Mobility Analytics Dashboard**: Real-time metric cards for online flights, vessels, satellites, ISS live status banner, and average speeds.
  - **Mobility Filter Panel**: Universal filter controls for object types, status, and text search.

## [0.3.0] - Earth Event Engine — Real-time Intelligence Platform - 2026-08-03

### Added
- **Earth Event Engine Core**: Reusable, extensible event engine orchestrating multi-provider data ingestion, validation, deduplication, spatial querying, and automatic expiration.
- **6 Real-time Event Providers**:
  - **USGS Earthquakes**: Live M2.5+ earthquake monitoring with magnitude-to-severity mapping, depth tracking, and tsunami flags.
  - **NASA EONET Wildfires**: Worldwide active fire detection with brightness/FRP intensity mapping.
  - **Smithsonian / EONET Volcanoes**: Active volcanic eruption tracking with VONA alert levels.
  - **Blitzortung Lightning**: Real-time cloud-to-ground lightning strike simulation based on global WWLLN density zones.
  - **NOAA Severe Storms**: Active tropical cyclones, typhoons, and hurricanes with Saffir-Simpson intensity classification.
  - **GDACS / USGS Tsunamis**: Dual-source tsunami warning alerts with geographic proximity deduplication.
- **Marker & Rendering Subsystem**: SVG data URI marker factory with severity color-coding, magnitude scaling, and pulse animation rings.
- **Offscreen Heatmap Engine**: GPU-optimized canvas density heatmap layer using `SingleTileImageryProvider`.
- **Spatial Cluster Engine**: Grid-based zoom-aware clustering with severity aggregation and dominant event type detection.
- **Earth Intelligence Dashboard (Analytics Panel)**: Real-time statistic cards, severity breakdown bars, and critical alert highlights.
- **Event Detail Panel**: Full GIS metadata view with coordinate copying, time-ago formatting, source attribution links, and location sharing.
- **Event List Panel**: Filterable, sortable (time/severity/magnitude), groupable active event list.
- **Universal Filter Engine & Filter Panel**: Composable search, type, and severity filtering.
- **Event Timeline Strip**: Temporal control bar for live and historical replay visualization.

---

## [0.2.0] - Dynamic Earth Expansion - 2026-08-03

### Added
- **Weather System Architecture**: Pluggable provider system (`IWeatherProvider`) with default Open-Meteo integration (free, backend-free, no API key required).
- **Information Panel**: Right-side slide-in panel displaying coordinates, reverse-geocoded place/country (via Nominatim), live weather metrics (temperature, humidity, pressure, wind speed/direction), and estimated local time on any globe click.
- **NASA GIBS Cloud Layer**: Real MODIS cloud coverage imagery with opacity controls and rotation drift simulation.
- **Atmosphere & Day/Night Layers**: Dedicated layer toggles in Layer Manager for atmospheric scattering (blue sky glow, depth fog) and dynamic sunlight/shadows.
- **Globe Interaction Marker**: Pulsing location indicator on clicked/searched positions with automatic removal on panel close.
- **High Dynamic Range (HDR)**: HDR rendering mode enabled for High and Ultra graphics presets.

### Changed
- Converted country borders layer to lightweight line-only GeoJSON (`ne_110m_admin_0_boundary_lines_land.geojson`) for maximum rendering stability and performance across all browsers.
- Expanded Layer Manager toggles to include base imagery, terrain, clouds, atmosphere, day/night, country borders, cities, and grid lines.

### Fixed
- Resolved Cesium worker `PolygonOutlineGeometry` subdivision crash on complex GeoJSON boundaries.

---

## [0.1.0] - Foundation Release - 2026-07-24

### Added
- 3D Globe Viewer powered by CesiumJS.
- Glassmorphism dark UI design system (Toolbar, Search Panel, Layers Panel, Settings Panel, Coordinates Display, FPS counter, Toast Notifications).
- Nominatim place search with fly-to animation.
- Layer Registry system supporting base imagery, terrain, borders, cities, and grid lines.
- CI/CD workflow with GitHub Pages automated deployment.
