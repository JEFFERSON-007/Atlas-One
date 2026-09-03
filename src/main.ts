/**
 * Atlas One — Main Application Entry Point
 * Bootstraps the Earth Intelligence Platform.
 */

import './cesium-init';
import './styles/index.css';
import './styles/cesium-overrides.css';

import { SceneManager } from './core/engine/scene-manager';
import { CameraController } from './core/engine/camera/camera-controller';
import { LightingManager } from './core/engine/lighting/lighting-manager';
import { SpaceEnvironment } from './core/engine/scene/space-environment';
import { AnimationController } from './core/engine/animation/animation-controller';
import { GlobeManager } from './globe/globe-manager';
import { LayerRegistry } from './layers/layer-registry';
import { UIManager } from './ui/ui-manager';
import { loadAppConfig } from './config/app.config';
import { createLogger } from './utils/logger';
import { eventBus } from './hooks/use-event-bus';

// v0.6 — AI Assistant
import { AIEngine } from './ai/engine';

// v0.8 — Visual Overhaul
import { PostProcessManager } from './core/engine/postfx/post-process-manager';
import { URLStateManager } from './core/state/url-state-manager';

// v0.3 — Earth Event Engine imports
import { EarthEventEngine } from './events/engine/event-engine';
import { EventRenderer } from './events/rendering/event-renderer';
import { HeatmapEngine } from './events/rendering/heatmap-engine';
import { FilterEngine } from './events/engine/filter-engine';


// v0.3 — Event Providers
import { USGSEarthquakeProvider } from './events/providers/usgs-earthquake.provider';
import { NASAWildfireProvider } from './events/providers/nasa-firms-wildfire.provider';
import { SmithsonianVolcanoProvider } from './events/providers/smithsonian-volcano.provider';
import { BlitzortungLightningProvider } from './events/providers/blitzortung-lightning.provider';
import { NOAAStormProvider } from './events/providers/noaa-storm.provider';
import { GDACSTsunamiProvider } from './events/providers/gdacs-tsunami.provider';

// Layer implementations
import { SatelliteImageryLayer } from './layers/implementations/satellite-imagery.layer';
import { BordersLayer } from './layers/implementations/borders.layer';
import { CitiesLayer } from './layers/implementations/cities.layer';
import { TerrainToggleLayer } from './layers/implementations/terrain.layer';
import { CloudsToggleLayer } from './layers/implementations/clouds.layer';
import { GridLayer } from './layers/implementations/grid.layer';
import { AtmosphereLayer } from './layers/implementations/atmosphere.layer';
import { DayNightLayer } from './layers/implementations/daynight.layer';

// v0.3 — Event Layer Implementations
import { EarthquakeLayer } from './layers/implementations/earthquake.layer';
import { WildfireLayer } from './layers/implementations/wildfire.layer';
import { VolcanoLayer } from './layers/implementations/volcano.layer';
import { LightningLayer } from './layers/implementations/lightning.layer';
import { StormLayer } from './layers/implementations/storm.layer';
import { TsunamiLayer } from './layers/implementations/tsunami.layer';
import { HeatmapLayer } from './layers/implementations/heatmap.layer';

// v0.4 — Dynamic Object Engine & Mobility imports
import { DynamicObjectEngine } from './mobility/engine/object-engine';
import { HistoricalMockProvider } from './events/providers/historical-mock-provider';
import { TemporalMode } from './twin/time/temporal-state.types';
import { temporalCache } from './twin/time/temporal-cache';
import type { EarthEvent } from './events/earth-event.types';
import { ObjectRenderer } from './mobility/rendering/object-renderer';
import { TrailEngine } from './mobility/rendering/trail-engine';
import { OrbitEngine } from './mobility/rendering/orbit-engine';
import { MobilityFilterEngine } from './mobility/engine/mobility-filter-engine';

// v0.4 — Mobility Providers
import { OpenSkyFlightProvider } from './mobility/providers/opensky-flight.provider';
import { CelesTrakSatelliteProvider } from './mobility/providers/celestrak-satellite.provider';
import { ISSTrackerProvider } from './mobility/providers/iss-tracker.provider';
import { AISShipProvider } from './mobility/providers/ais-ship.provider';

// v0.4 — Mobility Layer Implementations
import { FlightsLayer } from './layers/implementations/flights.layer';
import { ShipsLayer } from './layers/implementations/ships.layer';
import { SatellitesLayer } from './layers/implementations/satellites.layer';
import { ISSLayer } from './layers/implementations/iss.layer';
import { StarlinkLayer } from './layers/implementations/starlink.layer';
import { GPSConstellationLayer } from './layers/implementations/gps-constellation.layer';
import { OrbitPathsLayer } from './layers/implementations/orbit-paths.layer';
import { TrailsLayer } from './layers/implementations/trails.layer';

// v0.5 — Global Digital Twin imports
import { GeospatialEntityEngine } from './twin/entity/geospatial-entity-engine';
import { EntityRenderer } from './twin/rendering/entity-renderer';
import { Building3DRenderer } from './twin/rendering/building-3d-renderer';
import { VectorFeatureRenderer } from './twin/rendering/vector-feature-renderer';
import { SelectionManager } from './twin/selection/selection-manager';
import { LocationContextEngine } from './twin/context/location-context-engine';
import { RelatedEntitySystem } from './twin/context/related-entity-system';
import { LODManager } from './twin/lod/lod-manager';
import { TemporalEngine } from './twin/time/temporal-engine';
import { TerrainIntelligence } from './twin/terrain/terrain-intelligence';

// v0.5 — Digital Twin Providers
import { RESTCountriesProvider } from './twin/providers/rest-countries.provider';
import { OverpassGeospatialProvider } from './twin/providers/overpass-geospatial.provider';
import { CesiumOSMBuildingsProvider } from './twin/providers/cesium-osm-buildings.provider';
import { HydrologyProvider } from './twin/providers/hydrology.provider';
import { PopulationProvider } from './twin/providers/population.provider';

// v0.5 — Digital Twin Layer Implementations
import { CountriesLayer } from './layers/implementations/countries.layer';
import { Buildings3DLayer } from './layers/implementations/buildings-3d.layer';
import { RoadsLayer } from './layers/implementations/roads.layer';
import { HydrologyLayer } from './layers/implementations/hydrology.layer';
import { InfrastructureLayer } from './layers/implementations/infrastructure.layer';
import { AirportsLayer } from './layers/implementations/airports.layer';
import { PortsLayer } from './layers/implementations/ports.layer';
import { PopulationLayer } from './layers/implementations/population.layer';

// v0.8 — Environmental Engine & UI
import { EnvironmentalDataEngine } from './environment/engine/environmental-data-engine';
import { OpenMeteoWeatherProvider } from './environment/providers/open-meteo-weather.provider';
import { OpenAQAirQualityProvider } from './environment/providers/openaq-air-quality.provider';
import { FIRMSActiveFireProvider } from './environment/providers/firms-active-fire.provider';
import { OceanPlaceholderProvider } from './environment/providers/ocean-placeholder.provider';

import { TemperatureLayer } from './layers/implementations/temperature.layer';
import { PrecipitationLayer } from './layers/implementations/precipitation.layer';
import { WindLayer } from './layers/implementations/wind.layer';
import { AirQualityLayer } from './layers/implementations/air-quality.layer';
import { VegetationLayer } from './layers/implementations/vegetation.layer';
import { FloodLayer } from './layers/implementations/flood.layer';
import { DroughtLayer } from './layers/implementations/drought.layer';
import { SnowIceLayer } from './layers/implementations/snow-ice.layer';
import { OceanTemperatureLayer } from './layers/implementations/ocean-temperature.layer';
import { OceanCurrentsLayer } from './layers/implementations/ocean-currents.layer';

import { EnvironmentalLayerRenderer } from './environment/rendering/environmental-layer-renderer';
import { WindParticleRenderer } from './environment/rendering/wind-particle-renderer';

const log = createLogger('Main');

/**
 * Application bootstrap function.
 * Initializes all systems in the correct order.
 */
async function bootstrap(): Promise<void> {
  log.info('Atlas One v0.4 — Starting Global Mobility & Space Intelligence Platform...');

  // 1. Load configuration
  const config = loadAppConfig();
  log.info(`Config loaded: Ion=${config.hasCesiumIon}, Quality=${config.graphicsQuality}`);

  // 2. Initialize core engine
  const sceneManager = new SceneManager();
  const viewer = await sceneManager.init('cesium-container');

  // 3. Initialize lighting and space environment
  const lightingManager = new LightingManager();
  lightingManager.init(viewer);

  const spaceEnvironment = new SpaceEnvironment();
  spaceEnvironment.init(viewer);

  // 4. Initialize camera controller
  const cameraController = new CameraController();
  cameraController.init(viewer);

  // 11. Initialize Time Control
  const temporalEngine = new TemporalEngine();
  temporalEngine.init();

  // 5. Initialize globe system (terrain, imagery, clouds, atmosphere)
  const globeManager = new GlobeManager();
  await globeManager.init(viewer);

  // 5.5 Initialize v0.8 Environmental Data Engine
  const envEngine = new EnvironmentalDataEngine();
  envEngine.registerProvider(new OpenMeteoWeatherProvider());
  envEngine.registerProvider(new OpenAQAirQualityProvider());
  envEngine.registerProvider(new FIRMSActiveFireProvider());
  envEngine.registerProvider(new OceanPlaceholderProvider());

  // 6. Initialize v0.3 Earth Event Subsystems
  const eventRenderer = new EventRenderer();
  eventRenderer.init(viewer);

  const heatmapEngine = new HeatmapEngine();
  heatmapEngine.init(viewer);

  const filterEngine = new FilterEngine();

  const eventEngine = new EarthEventEngine();
  eventEngine.registerProvider(new USGSEarthquakeProvider());
  eventEngine.registerProvider(new NASAWildfireProvider());
  eventEngine.registerProvider(new SmithsonianVolcanoProvider());
  eventEngine.registerProvider(new BlitzortungLightningProvider());
  eventEngine.registerProvider(new NOAAStormProvider());
  eventEngine.registerProvider(new GDACSTsunamiProvider());
  eventEngine.registerHistoricalProvider(new HistoricalMockProvider());

  // Connect store changes to renderer and heatmap
  eventBus.on('events:updated', () => {
    const allEvents = eventEngine.store.getAll();
    const filtered = filterEngine.filterEvents(allEvents);
    eventRenderer.renderEvents(filtered);
    heatmapEngine.update(filtered);
  });

  // Start event engine
  eventEngine.start();

  // 7. Initialize v0.4 Dynamic Object Engine & Mobility Subsystems
  const objectRenderer = new ObjectRenderer();
  objectRenderer.init(viewer);

  const trailEngine = new TrailEngine();
  trailEngine.init(viewer);

  const orbitEngine = new OrbitEngine();
  await orbitEngine.init(viewer);

  const mobilityFilterEngine = new MobilityFilterEngine();

  const objectEngine = new DynamicObjectEngine();
  objectEngine.registerProvider(new OpenSkyFlightProvider());
  objectEngine.registerProvider(new CelesTrakSatelliteProvider());
  objectEngine.registerProvider(new ISSTrackerProvider());
  objectEngine.registerProvider(new AISShipProvider());

  eventBus.on('objects:updated', () => {
    const allObjects = objectEngine.store.getAll();
    const filtered = mobilityFilterEngine.apply(allObjects);
    objectRenderer.renderObjects(filtered);
    trailEngine.updateTrails(filtered);
    orbitEngine.renderOrbits(filtered);
  });

  objectEngine.start();

  // Temporal Integration for Historical Data
  eventBus.on('time:updated', (state) => {
    // Ensure stores clean up correctly according to simulation time
    eventEngine.store.cleanExpired(state.currentTime);

    if (state.mode === TemporalMode.HISTORICAL) {
      if (eventEngine.isRunning()) {
        eventEngine.stop();
        objectEngine.stop(); // No historical mock for mobility currently
      }

      // Simple caching by hour for the mock provider
      const timeMs = state.currentTime.getTime();
      const hourMs = 60 * 60 * 1000;
      const hourStart = new Date(Math.floor(timeMs / hourMs) * hourMs);
      const cacheKey = `hist-${hourStart.getTime()}`;

      const cachedEvents = temporalCache.get<EarthEvent[]>(cacheKey);

      if (!cachedEvents) {
        const range = { start: hourStart, end: new Date(hourStart.getTime() + hourMs) };
        void Promise.all([
          eventEngine.queryHistoricalData({ dataset: 'earthquakes', timeRange: range }),
          eventEngine.queryHistoricalData({ dataset: 'wildfires', timeRange: range }),
        ]).then(([eqResps, fireResps]) => {
          const events: EarthEvent[] = [];
          for (const r of eqResps) events.push(...r.events);
          for (const r of fireResps) events.push(...r.events);
          temporalCache.set(cacheKey, events, 300);
          eventEngine.store.upsert(events);
        });
      } else {
        eventEngine.store.upsert(cachedEvents);
      }

    } else if (state.mode === TemporalMode.REAL_TIME) {
      if (!eventEngine.isRunning()) {
        eventEngine.start();
        objectEngine.start();
      }
    }
  });

  // 8. Initialize v0.5 Global Digital Twin & Geospatial Subsystems
  const entityRenderer = new EntityRenderer();
  entityRenderer.init(viewer);

  const buildingProvider = new CesiumOSMBuildingsProvider();
  await buildingProvider.initTileset(viewer);

  const buildingRenderer = new Building3DRenderer();
  buildingRenderer.init(viewer, buildingProvider);

  const vectorRenderer = new VectorFeatureRenderer();
  vectorRenderer.init(viewer);

  const locationContextEngine = new LocationContextEngine();
  const relatedEntitySystem = new RelatedEntitySystem();
  relatedEntitySystem.init(locationContextEngine);

  const geospatialEngine = new GeospatialEntityEngine();
  geospatialEngine.registerProvider(new RESTCountriesProvider());
  geospatialEngine.registerProvider(new OverpassGeospatialProvider());
  geospatialEngine.registerProvider(buildingProvider);
  geospatialEngine.registerProvider(new HydrologyProvider());
  geospatialEngine.registerProvider(new PopulationProvider());

  locationContextEngine.init(geospatialEngine, eventEngine, objectEngine);

  const selectionManager = new SelectionManager();
  selectionManager.init(viewer, geospatialEngine, relatedEntitySystem);

  const lodManager = new LODManager();
  lodManager.init(viewer);

  const terrainIntel = new TerrainIntelligence();
  terrainIntel.init(viewer);

  eventBus.on('entities:updated', () => {
    const allEntities = geospatialEngine.store.getAll();
    entityRenderer.renderEntities(allEntities);
    vectorRenderer.renderVectorFeatures(allEntities);
  });

  await geospatialEngine.start();

  // 9. Initialize layer system
  const layerRegistry = new LayerRegistry();
  layerRegistry.setViewer(viewer);

  // v0.8 Renderers
  const envLayerRenderer = new EnvironmentalLayerRenderer();
  envLayerRenderer.init(viewer);
  
  const windParticleRenderer = new WindParticleRenderer();
  windParticleRenderer.init(viewer.container as HTMLElement);

  // Register all layers
  await Promise.all([
    layerRegistry.register(new SatelliteImageryLayer()),
    layerRegistry.register(new TerrainToggleLayer()),
    layerRegistry.register(new AtmosphereLayer(globeManager.atmosphere)),
    layerRegistry.register(new DayNightLayer(lightingManager)),
    layerRegistry.register(new CloudsToggleLayer(globeManager.clouds)),
    layerRegistry.register(new BordersLayer()),
    layerRegistry.register(new CitiesLayer()),
    layerRegistry.register(new GridLayer()),
    // v0.3 Event Layers
    layerRegistry.register(new EarthquakeLayer(eventRenderer)),
    layerRegistry.register(new WildfireLayer(eventRenderer)),
    layerRegistry.register(new VolcanoLayer(eventRenderer)),
    layerRegistry.register(new LightningLayer(eventRenderer)),
    layerRegistry.register(new StormLayer(eventRenderer)),
    layerRegistry.register(new TsunamiLayer(eventRenderer)),
    layerRegistry.register(new HeatmapLayer(heatmapEngine)),
    // v0.4 Mobility & Space Layers
    layerRegistry.register(new FlightsLayer(objectRenderer)),
    layerRegistry.register(new ShipsLayer(objectRenderer)),
    layerRegistry.register(new SatellitesLayer(objectRenderer)),
    layerRegistry.register(new ISSLayer(objectRenderer)),
    layerRegistry.register(new StarlinkLayer(objectRenderer)),
    layerRegistry.register(new GPSConstellationLayer(objectRenderer)),
    layerRegistry.register(new OrbitPathsLayer(orbitEngine)),
    layerRegistry.register(new TrailsLayer(trailEngine)),
    // v0.5 Global Digital Twin Layers
    layerRegistry.register(new CountriesLayer(entityRenderer)),
    layerRegistry.register(new Buildings3DLayer(buildingRenderer)),
    layerRegistry.register(new RoadsLayer(entityRenderer)),
    layerRegistry.register(new HydrologyLayer(entityRenderer)),
    layerRegistry.register(new AirportsLayer(entityRenderer)),
    layerRegistry.register(new PortsLayer(entityRenderer)),
    layerRegistry.register(new InfrastructureLayer(entityRenderer)),
    layerRegistry.register(new PopulationLayer(entityRenderer)),
    // v0.8 Environmental Layers
    layerRegistry.register(new TemperatureLayer(envEngine)),
    layerRegistry.register(new PrecipitationLayer(envEngine)),
    layerRegistry.register(new WindLayer(envEngine)),
    layerRegistry.register(new AirQualityLayer(envEngine)),
    layerRegistry.register(new VegetationLayer(envEngine)),
    layerRegistry.register(new FloodLayer(envEngine)),
    layerRegistry.register(new DroughtLayer(envEngine)),
    layerRegistry.register(new SnowIceLayer(envEngine)),
    layerRegistry.register(new OceanTemperatureLayer(envEngine)),
    layerRegistry.register(new OceanCurrentsLayer(envEngine)),
  ]);

  log.info(`${layerRegistry.getAll().length} total layers registered`);

  // 9.5 Initialize v0.6 AI Assistant
  const aiEngine = new AIEngine({
    layers: layerRegistry,
    camera: cameraController,
    events: eventEngine,
    mobility: objectEngine,
    time: temporalEngine,
    environment: envEngine,
  });
  
  // Register default provider
  void aiEngine.setProvider('MOCK');

  // v0.8 Initialize Visual Overhaul systems
  const postProcessManager = new PostProcessManager();
  postProcessManager.init(viewer);

  const urlStateManager = new URLStateManager();
  urlStateManager.init(viewer, postProcessManager, layerRegistry);
  
  // Apply URL state before creating UI
  const stateApplied = urlStateManager.applyFromURL();

  // 10. Initialize UI
  const uiManager = new UIManager();
  uiManager.init(
    viewer,
    layerRegistry,
    cameraController,
    sceneManager,
    globeManager,
    eventEngine,
    filterEngine,
    objectEngine,
    mobilityFilterEngine,
    geospatialEngine,
    terrainIntel,
    temporalEngine,
    aiEngine,
    postProcessManager,
    urlStateManager,
    envEngine
  );

  const animationController = new AnimationController();
  animationController.init(viewer);

  // 10. Play landing animation (only if URL state wasn't applied)
  if (!stateApplied) {
    await animationController.playLandingSequence();
  } else {
    // Bypass animation but still remove the loading overlay
    const splash = document.getElementById('splash-screen');
    const uiOverlay = document.getElementById('ui-overlay');
    if (splash) splash.style.display = 'none';
    if (uiOverlay) uiOverlay.style.opacity = '1';
  }

  // 11. Show notification
  if (!config.hasCesiumIon) {
    eventBus.emit('notification:show', {
      message: 'Running without Cesium Ion token. Add VITE_CESIUM_ION_TOKEN to .env for terrain and premium imagery.',
      type: 'info',
    });
  }

  log.info('Atlas One v0.4 Global Mobility & Space Intelligence Platform initialized successfully');

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    animationController.dispose();
    uiManager.dispose();
    layerRegistry.dispose();
    objectEngine.dispose();
    objectRenderer.dispose();
    trailEngine.dispose();
    orbitEngine.dispose();
    eventEngine.dispose();
    eventRenderer.dispose();
    heatmapEngine.dispose();
    globeManager.dispose();
    cameraController.dispose();
    lightingManager.dispose();
    spaceEnvironment.dispose();
    sceneManager.dispose();
    eventBus.off();
    log.info('Atlas One shutdown complete');
  });
}

// Global error handler — log only, no user-facing toast.
// Each module (search, event providers, layers) handles its own errors
// with specific user-facing messages. This handler is a safety net for logging.
window.addEventListener('error', (event) => {
  // Ignore resource load errors (img, script, link 404s)
  if (event.target && event.target !== window) return;

  // Ignore benign browser layout errors
  if (typeof event.message === 'string' && event.message.includes('ResizeObserver')) return;

  const msg = typeof event.message === 'string' ? event.message : '';
  log.warn(`Uncaught error (suppressed): ${msg}`);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason ?? '');
  log.warn(`Unhandled rejection (suppressed): ${reason.slice(0, 200)}`);
});

// Launch the application
bootstrap().catch((error) => {
  log.error('Failed to initialize Atlas One', error);

  const splash = document.getElementById('splash-screen');
  if (splash) splash.style.display = 'none';

  const app = document.getElementById('app');
  if (app) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText =
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;background:#0a0e17;color:#e2e8f0;font-family:Inter,sans-serif;padding:2rem;text-align:center;';
    errorDiv.innerHTML = `
      <h1 style="font-size:1.5rem;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:#94a3b8;">Atlas One</h1>
      <p style="color:#f87171;">Failed to initialize the application.</p>
      <p style="color:#64748b;font-size:0.85rem;">Please check the browser console for details.</p>
      <button onclick="location.reload()" style="padding:8px 20px;border:1px solid #334155;border-radius:8px;background:transparent;color:#e2e8f0;cursor:pointer;font-family:inherit;">Reload</button>
    `;
    app.appendChild(errorDiv);
  }
});
