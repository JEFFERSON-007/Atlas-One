# Changelog

All notable changes to the **Atlas One** Earth Intelligence Platform project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - Global Digital Twin & Geospatial Intelligence Platform - 2026-08-10

### Added
- **Global Digital Twin Subsystem**:
  - **Universal `GeospatialEntity` Model**: Standardized model for 23 geospatial entity types (Country, State, City, Building, Road, Airport, Port, Railway, River, Lake, Dam, PowerPlant, Hospital, School, University, WeatherStation, SatelliteGroundStation, Telecom, Industrial, Forest, ProtectedArea).
  - **Spatial Hash Index**: Grid-based spatial hash index (`CELL_SIZE_DEG = 2.0`) enabling O(1) bounding box queries and Haversine radius queries.
  - **Geospatial Entity Engine**: Centralized orchestrator coordinating data providers, schema validation, XSS text sanitization, spatial storage, and event bus emissions.
- **5 Open Geospatial Data Providers**:
  - **REST Countries Provider**: 250+ country boundaries, populations, capitals, areas, densities, regions, currencies, languages, timezones, and borders.
  - **OpenStreetMap Overpass Provider**: Global transport hubs, international airports (IATA/ICAO), and maritime container ports.
  - **Cesium OSM 3D Buildings Streaming Provider**: Global 3D building tileset streaming via Cesium `createOsmBuildingsAsync()`.
  - **Hydrology & Waterways Provider**: Major global rivers (Amazon, Nile, Yangtze, Mississippi), lakes (Caspian, Superior, Baikal), and hydro dams.
  - **Population Metrics Provider**: Global urban megacities and regional density statistics.
- **Intelligence & Context Systems**:
  - **Location Context Engine**: Real-time context aggregator returning country, city, Open-Meteo weather, natural hazards (v0.3), dynamic objects (v0.4), and infrastructure for any clicked coordinate.
  - **Related Entity System**: Interconnected entity relationship graph linking airports, ports, cities, events, flights, and ships.
  - **Dynamic LOD Manager**: Camera height-driven Level of Detail engine (Space View >5000km, Country View 500-5000km, City View 50-500km, Street View <50km).
  - **Master Time Controller**: Centralized time playback engine with real-time sync, simulation clock, step controls, and 0.25x to 100x playback speeds.
  - **Terrain Intelligence & Exaggeration**: Pointer elevation picker (Lat/Lng/Meters) and vertical terrain exaggeration controls (0.5x, 1x, 2x, 5x, 10x).
  - **Client-Side LRU Cache Manager**: Per-key TTL caching layer with capacity pruning.
- **Rendering & Selection Subsystems**:
  - **Unified Entity Renderer**: Billboard, label, and marker renderer with entity pooling and LOD visibility culling.
  - **3D Building Renderer**: Height-based gradient styling and 3D Tiles highlighting.
  - **Vector Feature Renderer**: Polyline renderer for rivers, roads, and boundaries.
  - **Unified Selection Manager**: Click picker for countries, cities, 3D buildings, airports, ports, infrastructure, aircraft, ships, satellites, and natural events.
- **8 Digital Twin Layer Implementations**:
  - `CountriesLayer`, `Buildings3DLayer`, `RoadsLayer`, `HydrologyLayer`, `AirportsLayer`, `PortsLayer`, `InfrastructureLayer`, `PopulationLayer`.
- **Digital Twin UI Components**:
  - **Digital Twin Inspection Panel**: 7-tabbed modal (Overview, Geography, Weather, Infrastructure, Transit, Events, Sources).
  - **Country Intelligence Panel**: Demographics, capital, population, languages, timezones, and borders explorer.
  - **City Intelligence Panel**: Megacities and urban statistics inspector.
  - **Globe Telemetry HUD**: Bottom-right HUD displaying Lat, Lng, Elevation (m), Camera altitude (km), LOD, and Exaggeration controls.
  - **Time Controller Bar**: Bottom playback control bar (Live sync, Play/Pause, Step, 0.25x-100x speed selector).

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
