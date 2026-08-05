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

const log = createLogger('Main');

/**
 * Application bootstrap function.
 * Initializes all systems in the correct order.
 */
async function bootstrap(): Promise<void> {
  log.info('Atlas One v0.3 — Starting Earth Intelligence Platform...');

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

  // 5. Initialize globe system (terrain, imagery, clouds, atmosphere)
  const globeManager = new GlobeManager();
  await globeManager.init(viewer);

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

  // Connect store changes to renderer and heatmap
  eventBus.on('events:updated', () => {
    const allEvents = eventEngine.store.getAll();
    const filtered = filterEngine.filterEvents(allEvents);
    eventRenderer.renderEvents(filtered);
    heatmapEngine.update(filtered);
  });

  // Start event engine
  eventEngine.start();

  // 7. Initialize layer system
  const layerRegistry = new LayerRegistry();
  layerRegistry.setViewer(viewer);

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
  ]);

  log.info(`${layerRegistry.getAll().length} total layers registered`);

  // 8. Initialize UI
  const uiManager = new UIManager();
  uiManager.init(viewer, layerRegistry, cameraController, sceneManager, globeManager, eventEngine, filterEngine);

  // 9. Play landing animation
  const animationController = new AnimationController();
  animationController.init(viewer);
  await animationController.playLandingSequence();

  // 10. Show notification
  if (!config.hasCesiumIon) {
    eventBus.emit('notification:show', {
      message: 'Running without Cesium Ion token. Add VITE_CESIUM_ION_TOKEN to .env for terrain and premium imagery.',
      type: 'info',
    });
  }

  log.info('Atlas One v0.3 Earth Intelligence Platform initialized successfully');

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    animationController.dispose();
    uiManager.dispose();
    layerRegistry.dispose();
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

// Global error handler
window.addEventListener('error', (event) => {
  // Ignore non-JavaScript errors like element/resource load errors (img, script, link)
  if (
    event.target &&
    event.target !== window &&
    (event.target instanceof HTMLElement || (event.target as { tagName?: string }).tagName)
  ) {
    return;
  }

  // Ignore benign browser layout errors
  if (typeof event.message === 'string' && event.message.includes('ResizeObserver')) {
    return;
  }

  // Ignore CesiumJS internal errors (workers, tile loading, rendering pipeline)
  const msg = typeof event.message === 'string' ? event.message : '';
  const filename = typeof event.filename === 'string' ? event.filename : '';
  if (
    filename.includes('cesium') ||
    filename.includes('Cesium') ||
    filename.includes('Workers/') ||
    msg.includes('An error occurred while rendering') ||
    msg.includes('RangeError') ||
    msg.includes('Script error')
  ) {
    log.warn(`CesiumJS internal error suppressed: ${msg}`);
    return;
  }

  log.error(`Uncaught error: ${msg}`, event.error);
  if (msg) {
    eventBus.emit('notification:show', {
      message: 'An unexpected error occurred. Some features may be unavailable.',
      type: 'error',
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason ?? '');

  // Don't show toast for non-critical rejections
  if (
    reason.includes('AbortError') ||
    reason.includes('canceled') ||
    reason.includes('Cesium') ||
    reason.includes('cesium') ||
    reason.includes('tile') ||
    reason.includes('imagery') ||
    reason.includes('Failed to fetch') ||
    reason.includes('NetworkError') ||
    reason.includes('Load failed') ||
    reason.includes('CORS') ||
    reason.includes('net::ERR')
  ) {
    log.warn(`Non-critical rejection suppressed: ${reason.slice(0, 120)}`);
    return;
  }

  log.error(`Unhandled promise rejection: ${reason}`);
  eventBus.emit('notification:show', {
    message: 'A background operation failed. Please try again.',
    type: 'error',
  });
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
